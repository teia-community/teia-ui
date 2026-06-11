import { useEffect, useRef, useState } from 'react'
import { Page } from '@atoms/layout'
import { Button } from '@atoms/button'
import { Loading } from '@atoms/loading'
import { calendarDB } from '@data/calendar'
import { useUserStore } from '@context/userStore'
import { CALENDAR_ADMINS } from '@constants'
import { useCalendarEvents, useIsCalendarAdmin } from '@hooks/use-calendar'
import CalendarEventCard from '@components/calendar/CalendarEventCard'
import EventForm from '@components/calendar/EventForm'
import MonthGrid from '@components/calendar/MonthGrid'
import styles from '@style'

/**
 * Calendar — thinnest viable slice.
 *
 * - Anyone can view the list of events.
 * - Only a connected wallet listed in CALENDAR_ADMINS sees the editing UI
 *   (the "edit gate" — see {@link useIsCalendarAdmin}).
 * - Data lives in IndexedDB via `calendarDB`, swappable for Postgres later.
 */
export default function Calendar() {
  const { events, isLoading, error, refresh } = useCalendarEvents()
  const isAdmin = useIsCalendarAdmin()
  const address = useUserStore((st) => st.address)

  // null = form closed; {} = creating; {id,...} = editing an existing event.
  const [editing, setEditing] = useState(null)
  const [actionError, setActionError] = useState(null)

  // The create/edit form lives in a popup; sync the <dialog> to `editing`.
  const formDialogRef = useRef(null)
  useEffect(() => {
    const dialog = formDialogRef.current
    if (!dialog) return
    if (editing && !dialog.open) dialog.showModal()
    else if (!editing && dialog.open) dialog.close()
  }, [editing])

  const handleSubmit = async (values) => {
    setActionError(null)
    try {
      // Audit who last wrote the record (see schema.js `createdBy`).
      const stamped = { ...values, createdBy: address || '' }
      if (editing?.id) {
        await calendarDB.update(editing.id, stamped)
      } else {
        await calendarDB.create(stamped)
      }
      setEditing(null)
      refresh()
    } catch (e) {
      setActionError(`Could not save event: ${e.message}`)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this event?')) return
    setActionError(null)
    try {
      await calendarDB.remove(id)
      refresh()
    } catch (e) {
      setActionError(`Could not delete event: ${e.message}`)
    }
  }

  return (
    <Page title="Teia Calendar">
      <div className={styles.container}>
        <header className={styles.header}>
          <h1 className={styles.headline}>Calendar</h1>
          {isAdmin && !editing && (
            <Button small onClick={() => setEditing({})}>
              + New event
            </Button>
          )}
        </header>

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
            onEdit={setEditing}
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
              onCancel={() => setEditing(null)}
            />
          )}
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
          <div className={styles.list}>
            {events.map((event) => (
              <CalendarEventCard
                key={event.id}
                event={event}
                canEdit={isAdmin}
                onEdit={setEditing}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>
    </Page>
  )
}
