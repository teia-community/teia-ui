import { useEffect, useMemo, useRef, useState } from 'react'
import useClipboard from 'react-use-clipboard'
import { Page } from '@atoms/layout'
import { Button } from '@atoms/button'
import { Loading } from '@atoms/loading'
import { useCalendarEvents } from '@hooks/use-calendar'
import {
  useCalendarRoles,
  useCalendarProposals,
  createEvent,
  updateEvent,
  setEventHidden,
  proposeEvent,
  proposeEdit,
  approveProposal,
  rejectProposal,
  fetchEventContent,
  uploadEventImage,
  showGetTeiaModal,
} from '@data/calendar-chain'
import CalendarEventCard from '@components/calendar/CalendarEventCard'
import EventForm from '@components/calendar/EventForm'
import MonthGrid from '@components/calendar/MonthGrid'
import PreviousEvents from '@components/calendar/PreviousEvents'
import styles from '@style'

/** First day of the current month as a YYYY-MM-DD string (local time). */
function currentMonthStart() {
  const now = new Date()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  return `${now.getFullYear()}-${m}-01`
}

/**
 * Calendar page — community events live on the teiaCalendar contract:
 *  - moderators / multisig create/edit/hide directly + approve/reject proposals;
 *  - TEIA holders propose new events and edits;
 *  - everyone else views + subscribes, and gets a "get TEIA" prompt.
 * WordPress events are merged in read-only.
 */
export default function Calendar() {
  const { events, isLoading, error, dismiss } = useCalendarEvents()
  const roles = useCalendarRoles()
  const { canModerate, canPropose } = roles
  const { data: proposals, mutate: refreshProposals } =
    useCalendarProposals(canModerate)

  // Feed URL for the Subscribe block (served at /calendar.ics — see netlify.toml).
  const ICS_URL =
    import.meta.env.VITE_CALENDAR_ICS_URL ||
    (typeof window !== 'undefined'
      ? `${window.location.origin}/calendar.ics`
      : '')
  const webcal = ICS_URL.replace(/^https?:\/\//, 'webcal://')
  const [copied, copy] = useClipboard(ICS_URL)

  // Form state. `editing`:
  //   null                                → closed
  //   { values, eventId: null, propose }  → create (propose = !canModerate)
  //   { values, eventId, propose }        → edit / propose-edit an existing event
  const [editing, setEditing] = useState(null)
  const [actionError, setActionError] = useState(null)
  const [opening, setOpening] = useState(false)

  // Split the date-sorted feed into upcoming vs the "Previous Events" accordion.
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

  // Sync the create/edit <dialog> to `editing`.
  const formDialogRef = useRef(null)
  useEffect(() => {
    const dialog = formDialogRef.current
    if (!dialog) return
    if (editing && !dialog.open) dialog.showModal()
    else if (!editing && dialog.open) dialog.close()
  }, [editing])

  // --- opening the form ----------------------------------------------------

  const startCreate = () => {
    setActionError(null)
    if (canModerate || canPropose) {
      setEditing({ values: {}, eventId: null, propose: !canModerate })
    } else {
      showGetTeiaModal()
    }
  }

  // Editing/proposing an edit needs the event's RAW IPFS doc so images stay as
  // ipfs:// URIs (the display feed rewrites them to gateway URLs).
  const startEditChain = async (event, propose) => {
    setActionError(null)
    setOpening(true)
    try {
      const doc = await fetchEventContent(event.cid)
      setEditing({
        values: {
          id: event.id,
          title: doc.title || '',
          startDate: doc.startDate || '',
          endDate: doc.endDate || '',
          location: doc.location || '',
          description: doc.description || '',
          links: Array.isArray(doc.links) ? doc.links : [],
          images: Array.isArray(doc.images) ? doc.images : [],
          recurrence: doc.recurrence,
        },
        eventId: event.eventId,
        propose,
      })
    } catch (e) {
      setActionError(`Could not load event for editing: ${e.message}`)
    } finally {
      setOpening(false)
    }
  }

  // --- write handlers (each on-chain action drives its own progress modal) ---

  const handleSubmit = async (values) => {
    setActionError(null)
    const { eventId, propose } = editing
    const input = {
      title: values.title,
      startDate: values.startDate,
      endDate: values.endDate || undefined,
      location: values.location || undefined,
      description: values.description || undefined,
      links: values.links || [],
      images: values.images || [],
      recurrence: values.recurrence,
    }
    try {
      if (eventId == null) {
        if (propose) await proposeEvent(input)
        else await createEvent(input)
      } else if (propose) {
        await proposeEdit(eventId, input)
      } else {
        await updateEvent(eventId, input)
      }
      setEditing(null)
    } catch (e) {
      // The action already surfaced a modal error; keep the form open.
      setActionError(e.message)
    }
  }

  const handleEdit = (event) => startEditChain(event, false)
  const handleProposeEdit = (event) => startEditChain(event, true)

  const handleHide = async (event) => {
    setActionError(null)
    try {
      await setEventHidden({ eventId: event.eventId, hidden: !event.hidden })
    } catch (e) {
      setActionError(e.message)
    }
  }

  const handleApprove = async (id) => {
    try {
      await approveProposal(id)
      refreshProposals()
    } catch (e) {
      setActionError(e.message)
    }
  }
  const handleReject = async (id) => {
    try {
      await rejectProposal(id)
      refreshProposals()
    } catch (e) {
      setActionError(e.message)
    }
  }

  // Shared handlers passed to every card / grid / accordion.
  const cardHandlers = {
    roles,
    onEdit: handleEdit,
    onHide: handleHide,
    onProposeEdit: handleProposeEdit,
    onDismiss: (event) => dismiss(event.id),
  }

  return (
    <Page title="Teia Calendar">
      <div className={styles.container}>
        <header className={styles.header}>
          <h1 className={styles.headline}>Calendar</h1>
          {!editing && (
            <Button shadow_box fit onClick={startCreate} disabled={opening}>
              {opening
                ? 'Opening…'
                : canModerate
                ? '+ New event'
                : 'Propose an event'}
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

        {/* Moderator proposal queue */}
        {canModerate && proposals?.length > 0 && (
          <section className={styles.queue}>
            <h2 className={styles.queue_title}>
              Pending proposals ({proposals.length})
            </h2>
            {proposals.map((p) => (
              <div key={p.id} className={styles.queue_row}>
                <div>
                  <strong>{p.title}</strong>{' '}
                  <span className={styles.queue_meta}>
                    {p.isNewEvent ? 'new event' : `edit #${p.eventId}`} · by{' '}
                    {p.proposer.slice(0, 8)}…
                  </span>
                </div>
                <div className={styles.queue_actions}>
                  <Button small onClick={() => handleApprove(p.id)}>
                    Approve
                  </Button>
                  <Button small secondary onClick={() => handleReject(p.id)}>
                    Reject
                  </Button>
                </div>
              </div>
            ))}
          </section>
        )}

        {/* Month grid: click a day to view its events in a popup. */}
        {!isLoading && <MonthGrid events={events} {...cardHandlers} />}

        {/* Create/edit popup. Esc fires onClose; Back/Cancel call onCancel. */}
        <dialog
          ref={formDialogRef}
          className={styles.form_dialog}
          onClose={() => setEditing(null)}
        >
          {editing && (
            <EventForm
              key={editing.values.id || 'new'}
              initial={editing.values}
              onSubmit={handleSubmit}
              onUploadImage={async (file) => ({
                url: await uploadEventImage(file),
              })}
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
          <>
            {upcoming.length === 0 ? (
              <p className={styles.empty}>No upcoming events.</p>
            ) : (
              <div className={styles.list}>
                {upcoming.map((event) => (
                  <CalendarEventCard
                    key={event.id}
                    event={event}
                    {...cardHandlers}
                  />
                ))}
              </div>
            )}
            <PreviousEvents events={previous} {...cardHandlers} />
          </>
        )}
      </div>
    </Page>
  )
}
