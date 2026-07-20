import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useCalendarDraftStore, draftKey } from '@context/calendarDraftStore'
import {
  useCalendarRoles,
  createEvent,
  updateEvent,
  setEventHidden,
  proposeEvent,
  proposeEdit,
  fetchEventContent,
  uploadEventImage,
  showGetTeiaModal,
} from '@data/calendar-chain'
import { eventColorToken } from '@data/calendar-chain/colors'
import { slugify } from '@data/wiki/links'
import { useCalendarEvents } from '@hooks/use-calendar'
import { toUTC, toLocalInput } from '@utils/datetime'
import EventForm from './EventForm'
import styles from '@style'

/**
 * The on-chain event editor: the create/edit/propose form modal plus the
 * moderator hide toggle. Extracted from the calendar page so both the public
 * calendar and the moderation console share one implementation. `onMutate` runs
 * after a successful write so the caller can refresh its list.
 *
 * Returns `cardHandlers` (spread onto every CalendarEventCard/MonthGrid),
 * `startCreate`, `opening`, `actionError`, `isEditing`, and `editorModal` (the
 * portalled form overlay, or null when closed).
 */
export default function useChainEventEditor({ onMutate } = {}) {
  const roles = useCalendarRoles()
  const { canModerate, canPropose } = roles

  // Existing chain event slugs, to block a create/edit from taking a name
  // that's already in use (slug -> owning eventId).
  const { events: allEvents } = useCalendarEvents()
  const takenSlugs = useMemo(() => {
    const m = new Map()
    for (const e of allEvents) {
      if (e.source === 'chain' && e.slug) m.set(e.slug, e.eventId)
    }
    return m
  }, [allEvents])

  // Form state. `editing`:
  //   null                                → closed
  //   { values, eventId: null, propose }  → create (propose = !canModerate)
  //   { values, eventId, propose }        → edit / propose-edit an existing event
  const [editing, setEditing] = useState(null)
  const [actionError, setActionError] = useState(null)
  const [opening, setOpening] = useState(false)
  // Keep form open when submitting
  const submittingRef = useRef(false)
  const modalRef = useRef(null)

  const closeForm = useCallback(() => {
    if (submittingRef.current) return
    setEditing(null)
  }, [])

  useEffect(() => {
    if (!editing) return
    const modal = modalRef.current
    // Whatever opened the modal gets focus back when it closes (WCAG 2.4.3).
    const opener = document.activeElement
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
      if (opener instanceof HTMLElement) opener.focus()
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
          color: eventColorToken(doc.color) || '',
          tags: (doc.tags ?? []).join(', '),
          description: doc.description || '',
          links: Array.isArray(doc.links) ? doc.links : [],
          images: Array.isArray(doc.images) ? doc.images : [],
          channels: Array.isArray(doc.channels) ? doc.channels : [],
          collabs: Array.isArray(doc.collabs) ? doc.collabs : [],
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

  // Drafts land in localStorage via zustand persist; writing on every keystroke
  // serializes the whole draft map each time, so batch it.
  const draftTimer = useRef(null)

  const handleSubmit = async (values) => {
    setActionError(null)
    const { eventId, propose } = editing
    const newSlug = slugify(values.title || '')
    if (
      newSlug &&
      takenSlugs.has(newSlug) &&
      takenSlugs.get(newSlug) !== eventId
    ) {
      setActionError(
        `An event named "${values.title}" already exists — please choose a different name.`
      )
      return
    }
    submittingRef.current = true
    const input = {
      title: values.title,
      startDate: toUTC(values.startDate),
      endDate: values.endDate ? toUTC(values.endDate) : undefined,
      locations: values.locations || [],
      description: values.description || undefined,
      color: values.color || undefined,
      links: values.links || [],
      images: values.images || [],
      recurrence: values.recurrence,
      tags: values.tags || [],
      channels: values.channels || [],
      collabs: values.collabs || [],
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
      clearTimeout(draftTimer.current)
      useCalendarDraftStore.getState().clearDraft(draftKey(eventId))
      setEditing(null)
      onMutate?.()
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
      const key = draftKey(editing.eventId)
      clearTimeout(draftTimer.current)
      draftTimer.current = setTimeout(() => {
        useCalendarDraftStore.getState().setDraft(key, values)
      }, 500)
    },
    [editing]
  )
  useEffect(() => () => clearTimeout(draftTimer.current), [])

  const handleHide = async (event) => {
    setActionError(null)
    try {
      await setEventHidden({ eventId: event.eventId, hidden: !event.hidden })
      onMutate?.()
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

  const editorModal = editing
    ? createPortal(
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
            aria-label={editing.eventId != null ? 'Edit event' : 'New event'}
          >
            <EventForm
              key={editing.values.id || 'new'}
              initial={editing.values}
              onSubmit={handleSubmit}
              onValuesChange={persistDraft}
              takenSlugs={takenSlugs}
              currentEventId={editing.eventId}
              onUploadImage={async (file) => ({
                url: await uploadEventImage(file),
              })}
              onCancel={closeForm}
            />
          </div>
        </div>,
        document.body
      )
    : null

  return {
    cardHandlers,
    startCreate,
    opening,
    actionError,
    isEditing: Boolean(editing),
    editorModal,
  }
}
