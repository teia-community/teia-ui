import { useEffect, useMemo, useRef, useState } from 'react'
import useClipboard from 'react-use-clipboard'
import { Page } from '@atoms/layout'
import { Button } from '@atoms/button'
import { Loading } from '@atoms/loading'
import { calendarDB, hasTempCalendarAPI } from '@data/calendar'
import { useUserStore } from '@context/userStore'
import { CALENDAR_ADMINS } from '@constants'
import { useCalendarEvents, useIsCalendarAdmin } from '@hooks/use-calendar'
import CalendarEventCard from '@components/calendar/CalendarEventCard'
import EventForm from '@components/calendar/EventForm'
import MonthGrid from '@components/calendar/MonthGrid'
import PreviousEvents from '@components/calendar/PreviousEvents'
import styles from '@style'

const MAX_PASSWORD_LENGTH = 20
const MAX_PASSWORD_FAILURES = 10

/** First day of the current month as a YYYY-MM-DD string (local time). */
function currentMonthStart() {
  const now = new Date()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  return `${now.getFullYear()}-${m}-01`
}

/**
 * Calendar — thinnest viable slice.
 *
 * - Anyone can view the list of events.
 * - Only a connected wallet listed in CALENDAR_ADMINS sees the editing UI
 *   (the "edit gate" — see {@link useIsCalendarAdmin}).
 * - Data lives in IndexedDB via `calendarDB`, swappable for Postgres later.
 */
export default function Calendar() {
  const { events, isLoading, error, refresh, dismiss } = useCalendarEvents()
  const isAdmin = useIsCalendarAdmin()
  const address = useUserStore((st) => st.address)
  // The .ics feed is served from this same site at /calendar.ics (see
  // netlify.toml). Derive the URL from the current origin so the Subscribe UI
  // works on every deploy with no config; VITE_CALENDAR_ICS_URL overrides it if
  // the feed is ever hosted on a different domain.
  const ICS_URL =
    import.meta.env.VITE_CALENDAR_ICS_URL ||
    (typeof window !== 'undefined'
      ? `${window.location.origin}/calendar.ics`
      : '')
  const webcal = ICS_URL.replace(/^https?:\/\//, 'webcal://')
  const [copied, copy] = useClipboard(ICS_URL)

  // null = form closed; {} = creating; {id,...} = editing an existing event.
  const [editing, setEditing] = useState(null)
  const [actionError, setActionError] = useState(null)
  const [calendarPassword, setCalendarPassword] = useState('')
  const [passwordDraft, setPasswordDraft] = useState('')
  const [passwordError, setPasswordError] = useState(null)
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [pendingWrite, setPendingWrite] = useState(null)
  const [passwordFailures, setPasswordFailures] = useState(0)

  const passwordLocked = passwordFailures >= MAX_PASSWORD_FAILURES

  // Split the date-sorted feed: this month + upcoming go in the main list;
  // everything before this month moves into the "Show Previous Events"
  // accordion (grouped by year then month).
  const { upcoming, previous } = useMemo(() => {
    const threshold = currentMonthStart()
    const upcoming = []
    const previous = []
    for (const ev of events) {
      const date = (ev.startDate || '').slice(0, 10)
      if (date && date < threshold) previous.push(ev)
      else upcoming.push(ev)
    }
    return { upcoming, previous }
  }, [events])

  // The create/edit form lives in a popup; sync the <dialog> to `editing`.
  const formDialogRef = useRef(null)
  const passwordDialogRef = useRef(null)
  const passwordInputRef = useRef(null)
  useEffect(() => {
    const dialog = formDialogRef.current
    if (!dialog) return
    if (editing && !dialog.open) dialog.showModal()
    else if (!editing && dialog.open) dialog.close()
  }, [editing])

  useEffect(() => {
    const dialog = passwordDialogRef.current
    if (!dialog) return
    if (pendingWrite && !dialog.open) {
      dialog.showModal()
      passwordInputRef.current?.focus()
    } else if (!pendingWrite && dialog.open) dialog.close()
  }, [pendingWrite])

  const continueWrite = (action) => {
    if (!action) return
    if (action.type === 'create') setEditing({})
    else if (action.type === 'edit') setEditing(action.event)
    else if (action.type === 'delete') deleteEvent(action.event)
  }

  const requirePassword = (action) => {
    if (!hasTempCalendarAPI || calendarPassword) {
      continueWrite(action)
      return
    }
    setPasswordDraft('')
    setPasswordError(null)
    setPendingWrite(action)
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    if (passwordSaving || passwordLocked) return
    if (passwordDraft.length > MAX_PASSWORD_LENGTH) {
      setPasswordError(
        `Password must be ${MAX_PASSWORD_LENGTH} characters or fewer.`
      )
      return
    }
    setPasswordSaving(true)
    setPasswordError(null)
    try {
      await calendarDB.validatePassword(passwordDraft)
      const action = pendingWrite
      setCalendarPassword(passwordDraft)
      setPasswordFailures(0)
      setPendingWrite(null)
      continueWrite(action)
    } catch (err) {
      setPasswordFailures((count) => {
        const next = count + 1
        if (next >= MAX_PASSWORD_FAILURES) {
          setPasswordError(
            'Too many failed password attempts. Reload the page to try again.'
          )
        } else {
          setPasswordError(
            `${
              err.message || 'Invalid calendar password'
            } (${next}/${MAX_PASSWORD_FAILURES})`
          )
        }
        return next
      })
    } finally {
      setPasswordSaving(false)
    }
  }

  const handleSubmit = async (values) => {
    setActionError(null)
    try {
      // Audit who last wrote the record (see schema.js `createdBy`).
      const stamped = { ...values, createdBy: address || '' }
      if (editing?.id) {
        await calendarDB.update(editing.id, stamped, {
          password: calendarPassword,
        })
      } else {
        await calendarDB.create(stamped, { password: calendarPassword })
      }
      setEditing(null)
      refresh()
    } catch (e) {
      setActionError(`Could not save event: ${e.message}`)
    }
  }

  const deleteEvent = async (event) => {
    // Read-only WP events aren't deletable — kick them out of state instead.
    if (event.readOnly) {
      dismiss(event.id)
      return
    }
    if (!window.confirm('Delete this event?')) return
    setActionError(null)
    try {
      await calendarDB.remove(event.id, { password: calendarPassword })
      refresh()
    } catch (e) {
      setActionError(`Could not delete event: ${e.message}`)
    }
  }

  const handleDelete = (event) => requirePassword({ type: 'delete', event })

  return (
    <Page title="Teia Calendar">
      <div className={styles.container}>
        <header className={styles.header}>
          <h1 className={styles.headline}>Calendar</h1>
          {isAdmin && !editing && (
            <Button small onClick={() => requirePassword({ type: 'create' })}>
              + New event
            </Button>
          )}
        </header>

        {ICS_URL && (
          <div className={styles.subscribe}>
            <Button small href={webcal}>
              Subscribe in calendar app
            </Button>
            <Button small secondary onClick={copy}>
              {copied ? 'Copied!' : 'Copy feed URL'}
            </Button>
            <p className={styles.subscribe_hint}>
              Google Calendar can take up to a day to refresh subscribed
              calendars.
            </p>
          </div>
        )}

        {/* Surfaced when a connected wallet can't edit because the allowlist
            is empty — a config hint, not shown to ordinary visitors once
            admins exist. */}
        {address && !isAdmin && CALENDAR_ADMINS.length === 0 && (
          <p className={styles.hint}>
            Editing is disabled: no admin addresses are configured (see
            CALENDAR_ADMINS in src/constants.ts).
          </p>
        )}

        {/* Month grid: click a day to view its events in a popup. */}
        {!isLoading && (
          <MonthGrid
            events={events}
            canEdit={isAdmin}
            onEdit={(event) => requirePassword({ type: 'edit', event })}
            onDelete={handleDelete}
          />
        )}

        {/* Create/edit popup. Esc fires onClose; Back/Cancel call onCancel. */}
        <dialog
          ref={formDialogRef}
          className={styles.form_dialog}
          onClose={() => setEditing(null)}
        >
          {isAdmin && editing && (
            <EventForm
              key={editing.id || 'new'}
              initial={editing}
              onSubmit={handleSubmit}
              onUploadImage={(file) =>
                calendarDB.uploadImage(file, { password: calendarPassword })
              }
              onCancel={() => setEditing(null)}
            />
          )}
        </dialog>

        <dialog
          ref={passwordDialogRef}
          className={styles.password_dialog}
          onClose={() => setPendingWrite(null)}
        >
          <form
            className={styles.password_form}
            onSubmit={handlePasswordSubmit}
          >
            <div className={styles.password_top}>
              <strong>Calendar password</strong>
              <Button
                small
                secondary
                type="button"
                onClick={() => setPendingWrite(null)}
              >
                Cancel
              </Button>
            </div>
            <label className={styles.password_field}>
              <span>Write password</span>
              <input
                type="password"
                required
                ref={passwordInputRef}
                maxLength={MAX_PASSWORD_LENGTH}
                value={passwordDraft}
                onChange={(e) => setPasswordDraft(e.target.value)}
                autoComplete="current-password"
              />
            </label>
            {passwordLocked && (
              <p className={styles.error} role="alert">
                Too many failed password attempts. Reload the page to try again.
              </p>
            )}
            {passwordError && (
              <p className={styles.error} role="alert">
                {passwordError}
              </p>
            )}
            <div className={styles.password_actions}>
              <Button
                small
                type="submit"
                disabled={passwordSaving || passwordLocked}
              >
                {passwordSaving ? 'Checking...' : 'Continue'}
              </Button>
            </div>
          </form>
        </dialog>

        {error && (
          <p className={styles.error}>Could not load events: {error.message}</p>
        )}
        {actionError && (
          <p className={styles.error} role="alert">
            {actionError}
          </p>
        )}

        {isLoading ? (
          <Loading message="Loading calendar" />
        ) : events.length === 0 ? (
          <p className={styles.empty}>No events yet.</p>
        ) : (
          <>
            {upcoming.length === 0 ? (
              <p className={styles.empty}>No upcoming events.</p>
            ) : (
              <div className={styles.list}>
                {upcoming.map((event) => (
                  <CalendarEventCard
                    key={event.id}
                    event={event}
                    canEdit={isAdmin}
                    onEdit={(event) => requirePassword({ type: 'edit', event })}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
            <PreviousEvents
              events={previous}
              canEdit={isAdmin}
              onEdit={(event) => requirePassword({ type: 'edit', event })}
              onDelete={handleDelete}
            />
          </>
        )}
      </div>
    </Page>
  )
}
