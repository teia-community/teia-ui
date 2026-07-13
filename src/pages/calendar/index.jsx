import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import useClipboard from 'react-use-clipboard'
import { Page } from '@atoms/layout'
import { useCalendarDraftStore, draftKey } from '@context/calendarDraftStore'
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
  docToDisplayEvent,
} from '@data/calendar-chain'
import { useUserProfiles } from '@data/roles'
import { toUTC, toLocalInput } from '@utils/datetime'
import CalendarEventCard from '@components/calendar/CalendarEventCard'
import EventForm from '@components/calendar/EventForm'
import MonthGrid from '@components/calendar/MonthGrid'
import styles from '@style'

/**
 * Calendar page — community events live on the teiaCalendar contract:
 *  - moderators / multisig create/edit/hide directly + approve/reject proposals;
 *  - TEIA holders propose new events and edits;
 *  - everyone else views + subscribes, and gets a "get TEIA" prompt.
 * WordPress events are merged in read-only.
 */
const SHOW_TTC_KEY = 'calendar:showTtc'

export default function Calendar() {
  const { events: allEvents, isLoading, error } = useCalendarEvents()

  // Toggle for thetezos.com (TTC) events.
  const [showTtc, setShowTtc] = useState(() => {
    if (typeof window === 'undefined') return true
    return window.localStorage.getItem(SHOW_TTC_KEY) !== '0'
  })
  useEffect(() => {
    window.localStorage.setItem(SHOW_TTC_KEY, showTtc ? '1' : '0')
  }, [showTtc])

  const events = useMemo(
    () => (showTtc ? allEvents : allEvents.filter((e) => e.source !== 'wp')),
    [allEvents, showTtc]
  )

  const roles = useCalendarRoles()
  const { canModerate, canPropose } = roles
  const { data: proposals, mutate: refreshProposals } =
    useCalendarProposals(canModerate)
  // Aliases for proposer addresses shown in the moderator queue.
  const { data: proposerProfiles } = useUserProfiles(
    (proposals ?? []).map((p) => p.proposer)
  )
  const proposerLabel = (address) =>
    proposerProfiles?.[address]?.alias || `${address.slice(0, 8)}…`

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
  // Keep form open when submitting
  const submittingRef = useRef(false)

  // Trying to fix DOM overlay on create form
  const modalRef = useRef(null)
  const closeForm = useCallback(() => {
    if (submittingRef.current) return
    setEditing(null)
  }, [])

  useEffect(() => {
    if (!editing) return
    const modal = modalRef.current
    const FOCUSABLE =
      'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])'
    modal?.querySelector(FOCUSABLE)?.focus()

    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const onKeyDown = (e) => {
      if (submittingRef.current) return
      if (e.key === 'Escape') {
        e.preventDefault()
        closeForm()
        return
      }
      if (e.key === 'Tab' && modal) {
        const items = modal.querySelectorAll(FOCUSABLE)
        if (!items.length) return
        const first = items[0]
        const last = items[items.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = prevOverflow
    }
  }, [editing, closeForm])

  // --- opening the form ----------------------------------------------------

  const startCreate = () => {
    setActionError(null)
    if (canModerate || canPropose) {
      const draft = useCalendarDraftStore.getState().drafts[draftKey(null)]
      setEditing({ values: draft || {}, eventId: null, propose: !canModerate })
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
      const draft =
        useCalendarDraftStore.getState().drafts[draftKey(event.eventId)]
      setEditing({
        values: draft || {
          id: event.id,
          title: doc.title || '',
          startDate: toLocalInput(doc.startDate || ''),
          endDate: toLocalInput(doc.endDate || ''),
          location: (doc.locations?.length
            ? doc.locations
            : doc.location
            ? [doc.location]
            : []
          ).join(', '),
          tags: (doc.tags ?? []).join(', '),
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
    submittingRef.current = true
    const { eventId, propose } = editing
    const input = {
      title: values.title,
      startDate: toUTC(values.startDate),
      endDate: values.endDate ? toUTC(values.endDate) : undefined,
      locations: values.locations || [],
      description: values.description || undefined,
      links: values.links || [],
      images: values.images || [],
      recurrence: values.recurrence,
      tags: values.tags || [],
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
      // Saved on-chain, drop the draft and close the form.
      useCalendarDraftStore.getState().clearDraft(draftKey(eventId))
      setEditing(null)
    } catch (e) {
      setActionError(e.message)
    } finally {
      submittingRef.current = false
    }
  }

  const handleEdit = (event) => startEditChain(event, false)
  const handleProposeEdit = (event) => startEditChain(event, true)

  const persistDraft = useCallback(
    (values) => {
      if (!editing) return
      useCalendarDraftStore
        .getState()
        .setDraft(draftKey(editing.eventId), values)
    },
    [editing]
  )

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
  }

  return (
    <Page title="Teia Calendar">
      <div className={styles.container}>
        <header className={styles.header}>
          <h1 className={styles.headline}>Calendar</h1>
          <div className={styles.header_actions}>
            <button
              type="button"
              className={`${styles.ttc_toggle} ${
                showTtc ? styles.ttc_toggle_on : ''
              }`}
              aria-pressed={showTtc}
              onClick={() => setShowTtc((v) => !v)}
              title={
                showTtc
                  ? 'Hide thetezos.com events'
                  : 'Show thetezos.com events'
              }
            >
              thetezos.com events
            </button>
            {ICS_URL && (
              <details className={styles.subscribe}>
                <summary className={styles.subscribe_toggle}>Subscribe</summary>
                <div className={styles.subscribe_panel}>
                  <Button shadow_box small href={webcal}>
                    Subscribe to calendar
                  </Button>
                  <Button shadow_box small secondary onClick={copy}>
                    {copied ? 'Copied!' : 'Copy feed URL'}
                  </Button>
                  <p className={styles.subscribe_hint}>
                    Some 3rd Party Calendars can take up to a day to refresh
                    subscribed calendars.
                  </p>
                </div>
              </details>
            )}
            {!editing && (
              <Button shadow_box fit onClick={startCreate} disabled={opening}>
                {opening
                  ? 'Opening…'
                  : canModerate
                  ? '+ New event'
                  : 'Propose an event'}
              </Button>
            )}
          </div>
        </header>

        {/* Moderator proposal queue */}
        {canModerate && proposals?.length > 0 && (
          <section className={styles.queue}>
            <h2 className={styles.queue_title}>
              Pending proposals ({proposals.length})
            </h2>
            {proposals.map((p) => (
              <div key={p.id} className={styles.queue_item}>
                <div className={styles.queue_head}>
                  <span className={styles.queue_meta}>
                    {p.isNewEvent ? 'New event' : `Edit of event #${p.eventId}`}{' '}
                    · proposed by {proposerLabel(p.proposer)}
                  </span>
                  <div className={styles.queue_actions}>
                    <Button shadow_box fit onClick={() => handleApprove(p.id)}>
                      Approve
                    </Button>
                    <Button shadow_box fit onClick={() => handleReject(p.id)}>
                      Reject
                    </Button>
                  </div>
                </div>
                {/* Full proposed content — moderators see what they approve. */}
                {p.doc ? (
                  <CalendarEventCard
                    event={docToDisplayEvent(p.doc, `proposal-${p.id}`)}
                  />
                ) : (
                  <p className={styles.queue_meta}>
                    Couldn’t load the proposed content from IPFS (CID:{' '}
                    {p.proposedCid}).
                  </p>
                )}
              </div>
            ))}
          </section>
        )}

        {/* Month grid: click a day to view its events in a popup. */}
        {!isLoading && <MonthGrid events={events} {...cardHandlers} />}

        {/* Needs an overhaul */}
        {editing &&
          createPortal(
            <div
              className={styles.form_overlay}
              role="presentation"
              onMouseDown={(e) => {
                if (e.target === e.currentTarget) closeForm()
              }}
            >
              <div
                ref={modalRef}
                className={styles.form_modal}
                role="dialog"
                aria-modal="true"
                aria-label={
                  editing.eventId != null ? 'Edit event' : 'New event'
                }
              >
                <EventForm
                  key={editing.values.id || 'new'}
                  initial={editing.values}
                  onSubmit={handleSubmit}
                  onValuesChange={persistDraft}
                  onUploadImage={async (file) => ({
                    url: await uploadEventImage(file),
                  })}
                  onCancel={closeForm}
                />
              </div>
            </div>,
            document.body
          )}

        {error && (
          <p className={styles.error}>Could not load events: {error.message}</p>
        )}
        {actionError && (
          <p className={styles.error} role="alert">
            {actionError}
          </p>
        )}

        {isLoading && <Loading message="Loading calendar" />}
      </div>
    </Page>
  )
}
