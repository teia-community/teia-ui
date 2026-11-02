import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Page } from '@atoms/layout'
import { Loading } from '@atoms/loading'
import EventEditorDialog from '@components/events/EventEditorDialog'
import Tour, { TourLink } from '@components/tour'
import { useEvents } from '@hooks/use-events'
import { useModalStore } from '@context/modalStore'
import { REGISTRIES_ENABLED } from '@data/registries'
import {
  approveEventProposal,
  createEvent,
  proposeEvent,
  rejectEventProposal,
  setEventHidden,
  updateEvent,
  useEventProposals,
  useEventRoles,
  useModeratableEvents,
} from '@data/events-chain'
import styles from './index.module.scss'

function getBannerTextColor(hex) {
  const value = hex?.replace('#', '')
  if (!value || value.length !== 6) return '#191919'

  const [r, g, b] = [0, 2, 4].map((offset) =>
    parseInt(value.slice(offset, offset + 2), 16)
  )
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.6 ? '#191919' : '#ffffff'
}

// The form's own steps live in EventEditorDialog (it opens as a modal, above
// anything rendered here).
const EVENTS_TOUR = [
  {
    target: 'add-event',
    text: 'Click "+ Add event" to open the event form.',
    next: false,
    align: 'right',
  },
]

/**
 * Events page backed by the normalized GET /events feed. The request is
 * currently mocked in the data layer while the backend endpoint is developed.
 */
export default function Events() {
  const [editingEvent, setEditingEvent] = useState(null)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [localEvents, setLocalEvents] = useState([])
  const dialogRef = useRef(null)
  const { events, error, isLoading } = useEvents()
  const [params, setParams] = useSearchParams()

  // On-chain registry (shadownet test mode): moderators also get hidden
  // events and the proposal queue.
  const roles = useEventRoles()
  const canModerate = REGISTRIES_ENABLED && roles.canModerate
  const { data: modEvents } = useModeratableEvents(canModerate)
  const { data: proposals } = useEventProposals(canModerate)
  const pending = (proposals ?? []).filter((p) => p.status === 'pending')

  useEffect(() => {
    setLocalEvents((canModerate && modEvents) || events)
  }, [events, modEvents, canModerate])

  const addEvent = () => {
    if (REGISTRIES_ENABLED && !roles.canModerate && !roles.canPropose) {
      useModalStore
        .getState()
        .show(
          'Add event',
          roles.isConnected
            ? 'Proposing an event requires holding TEIA tokens.'
            : 'Sync your wallet to propose an event.'
        )
      return
    }
    setEditingEvent({})
  }

  // Moderators publish directly; token holders submit a proposal.
  const saveOnChain = async (event) => {
    const { eventId } = editingEvent
    const input = {
      title: event.title,
      subtitle: event.subtitle,
      description: event.description,
      link: event.link,
      screenshot: event.screenshot,
      bannerColor: event.bannerColor,
    }
    // The editor is a top-layer <dialog>: close it so the wallet feedback
    // modal is visible, and reopen it with the draft if the call fails.
    setEditingEvent(null)
    try {
      if (eventId != null) await updateEvent(eventId, input)
      else if (roles.canModerate) await createEvent(input)
      else await proposeEvent(input)
    } catch {
      setEditingEvent({ ...event, eventId })
    }
  }
  // Failures are surfaced by the action's own modal.
  const quiet = (action) => () => action().catch(() => {})

  useEffect(() => {
    if (!selectedEvent) return undefined

    const dialog = dialogRef.current
    dialog?.showModal()

    const closeOnEscape = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        dialog?.close()
        setSelectedEvent(null)
      }
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => {
      window.removeEventListener('keydown', closeOnEscape)
      if (dialog?.open) dialog.close()
    }
  }, [selectedEvent])

  const saveEvent = (event) => {
    if (REGISTRIES_ENABLED) return saveOnChain(event)
    setLocalEvents((current) => {
      const existing = current.findIndex((item) => item.id === event.id)
      if (existing === -1) return [...current, event]
      return current.map((item, index) => (index === existing ? event : item))
    })
    setEditingEvent(null)
    // Submitting finishes the add-event tour.
    if (params.get('tour') === 'events') {
      params.delete('tour')
      setParams(params)
    }
  }

  return (
    <Page title="Events">
      {!editingEvent && <Tour name="events" steps={EVENTS_TOUR} />}
      <div className={styles.container}>
        <header className={styles.header}>
          <div className={styles.header_top}>
            <h1 className={styles.headline}>Events</h1>
            <div className={styles.header_actions}>
              <button type="button" data-tour="add-event" onClick={addEvent}>
                + Add event
              </button>
              <TourLink name="events" title="How to add an event" />
            </div>
          </div>
          <p className={styles.intro}>
            Teia community events, initiatives, and announcements.
          </p>
        </header>

        {pending.length > 0 && (
          <div className={styles.event_list}>
            {pending.map((p) => (
              <article className={styles.event_card} key={p.id}>
                <div className={styles.card_copy}>
                  <h2>Proposal: {p.title}</h2>
                  <p className={styles.subtitle}>{p.doc?.subtitle}</p>
                  <p>{p.doc?.description}</p>
                  <p>
                    {p.doc?.link} · proposed by {p.proposer}
                  </p>
                  <div className={styles.header_actions}>
                    <button
                      type="button"
                      onClick={quiet(() => approveEventProposal(p.id))}
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={quiet(() => rejectEventProposal(p.id))}
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {!isLoading && !error && (
          <div className={styles.event_list}>
            {localEvents.map((event) => (
              <article className={styles.event_card} key={event.id}>
                <div className={styles.card_content}>
                  <div className={styles.card_copy}>
                    <h2>{event.title}</h2>
                    <p className={styles.subtitle}>{event.subtitle}</p>
                    <p>{event.description}</p>
                    <a href={event.link} target="_blank" rel="noreferrer">
                      Visit event site ↗
                    </a>
                    {canModerate && (
                      <div className={styles.header_actions}>
                        {event.hidden && <span>Hidden</span>}
                        <button
                          type="button"
                          onClick={() => setEditingEvent(event)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={quiet(() =>
                            setEventHidden({
                              eventId: event.eventId,
                              hidden: !event.hidden,
                            })
                          )}
                        >
                          {event.hidden ? 'Unhide' : 'Hide'}
                        </button>
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    className={styles.preview}
                    onClick={() => setSelectedEvent(event)}
                    aria-label={`Preview ${event.title}`}
                  >
                    <img src={event.screenshot} alt="" loading="lazy" />
                    <span>Preview</span>
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}

        {error && (
          <p className={styles.error} role="alert">
            Could not load events: {error.message}
          </p>
        )}

        {isLoading && <Loading message="Loading events" />}
      </div>

      {selectedEvent && (
        <dialog
          ref={dialogRef}
          className={styles.dialog}
          onCancel={() => setSelectedEvent(null)}
        >
          <div className={styles.dialog_panel}>
            <div
              className={styles.dialog_header}
              style={{
                backgroundColor: selectedEvent.bannerColor,
                color: getBannerTextColor(selectedEvent.bannerColor),
              }}
            >
              <div className={styles.dialog_summary}>
                <h2>{selectedEvent.title}</h2>
                <p>{selectedEvent.subtitle}</p>
                <span>{selectedEvent.description}</span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEvent(null)}
                aria-label="Close preview"
                style={{ color: getBannerTextColor(selectedEvent.bannerColor) }}
              >
                ×
              </button>
            </div>
            <iframe
              src={selectedEvent.link}
              title={`${selectedEvent.title} preview`}
              className={styles.iframe}
            />
          </div>
        </dialog>
      )}

      {editingEvent && (
        <EventEditorDialog
          event={editingEvent}
          onClose={() => setEditingEvent(null)}
          onSave={saveEvent}
        />
      )}
    </Page>
  )
}
