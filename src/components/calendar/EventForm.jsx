import { useState } from 'react'
import { Button } from '@atoms/button'
import { blankEvent } from '@data/calendar'
import styles from '@style'

/**
 * Create/edit form for a calendar event. Supports a repeatable list of links
 * ({ label, url }) and a repeatable list of image URLs (shown as a carousel on
 * the card). This component is only mounted for admins; it does not enforce the
 * gate itself.
 *
 * @param {{
 *   initial?: Partial<import('@data/calendar/schema').CalendarEvent>,
 *   onSubmit: (values: any) => Promise<void> | void,
 *   onCancel: () => void,
 * }} props
 */
export default function EventForm({ initial, onSubmit, onCancel }) {
  const [values, setValues] = useState(() => ({ ...blankEvent(), ...initial }))
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState(null)

  const set = (field) => (e) =>
    setValues((v) => ({ ...v, [field]: e.target.value }))

  // datetime-local already renders a native date+time picker; this makes the
  // whole field open it, not just the calendar glyph at its edge.
  const openPicker = (e) => {
    try {
      e.currentTarget.showPicker?.()
    } catch {
      // Not user-gesture / unsupported — typing still works.
    }
  }

  // --- links --------------------------------------------------------------
  const addLink = () =>
    setValues((v) => ({ ...v, links: [...v.links, { label: '', url: '' }] }))
  const setLink = (i, key) => (e) =>
    setValues((v) => {
      const links = v.links.map((l, idx) =>
        idx === i ? { ...l, [key]: e.target.value } : l
      )
      return { ...v, links }
    })
  const removeLink = (i) =>
    setValues((v) => ({ ...v, links: v.links.filter((_, idx) => idx !== i) }))

  // --- images -------------------------------------------------------------
  const addImage = () => setValues((v) => ({ ...v, images: [...v.images, ''] }))
  const setImage = (i) => (e) =>
    setValues((v) => ({
      ...v,
      images: v.images.map((url, idx) => (idx === i ? e.target.value : url)),
    }))
  const removeImage = (i) =>
    setValues((v) => ({ ...v, images: v.images.filter((_, idx) => idx !== i) }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    // Button's `disabled` prop is style-only, so guard re-entry here.
    if (saving) return
    setFormError(null)
    // datetime-local strings share a format, so lexicographic == chronological.
    if (
      values.endDate &&
      values.startDate &&
      values.endDate < values.startDate
    ) {
      setFormError('End must be after start.')
      return
    }
    setSaving(true)
    try {
      // Drop empty rows before saving.
      const cleaned = {
        ...values,
        links: values.links.filter((l) => l.url.trim()),
        images: values.images.filter((url) => url.trim()),
      }
      await onSubmit(cleaned)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.form_top}>
        <Button
          small
          secondary
          type="button"
          onClick={onCancel}
          alt="Back to calendar"
        >
          ← Back
        </Button>
        <strong>{initial?.id ? 'Edit event' : 'New event'}</strong>
      </div>

      <label className={styles.field}>
        <span>Title</span>
        <input
          type="text"
          required
          value={values.title}
          onChange={set('title')}
          placeholder="Event title"
        />
      </label>

      <div className={styles.field_row}>
        <label className={styles.field}>
          <span>Starts</span>
          <input
            type="datetime-local"
            required
            value={values.startDate}
            onChange={set('startDate')}
            onClick={openPicker}
          />
        </label>
        <label className={styles.field}>
          <span>Ends (optional)</span>
          <input
            type="datetime-local"
            value={values.endDate}
            onChange={set('endDate')}
            onClick={openPicker}
          />
        </label>
      </div>

      <label className={styles.field}>
        <span>Location (optional)</span>
        <input
          type="text"
          value={values.location}
          onChange={set('location')}
          placeholder="Where / online"
        />
      </label>

      <label className={styles.field}>
        <span>Description</span>
        <textarea
          rows={4}
          value={values.description}
          onChange={set('description')}
          placeholder="What's happening?"
        />
      </label>

      {/* Links */}
      <fieldset className={styles.group}>
        <legend>Links</legend>
        {values.links.map((link, i) => (
          <div className={styles.repeat_row} key={i}>
            <input
              type="text"
              value={link.label}
              onChange={setLink(i, 'label')}
              placeholder="Label"
              aria-label={`Link ${i + 1} label`}
            />
            <input
              type="url"
              value={link.url}
              onChange={setLink(i, 'url')}
              placeholder="https://…"
              aria-label={`Link ${i + 1} URL`}
            />
            <Button small secondary type="button" onClick={() => removeLink(i)}>
              Remove
            </Button>
          </div>
        ))}
        <Button small secondary type="button" onClick={addLink}>
          + Add link
        </Button>
      </fieldset>

      {/* Images (carousel) */}
      <fieldset className={styles.group}>
        <legend>Images (carousel)</legend>
        {values.images.map((url, i) => (
          <div className={styles.repeat_row} key={i}>
            <input
              type="url"
              value={url}
              onChange={setImage(i)}
              placeholder="https://…/image.png"
              aria-label={`Image ${i + 1} URL`}
            />
            <Button
              small
              secondary
              type="button"
              onClick={() => removeImage(i)}
            >
              Remove
            </Button>
          </div>
        ))}
        <Button small secondary type="button" onClick={addImage}>
          + Add image
        </Button>
      </fieldset>

      {formError && (
        <p className={styles.form_error} role="alert">
          {formError}
        </p>
      )}

      <div className={styles.form_actions}>
        <Button
          small
          secondary
          type="button"
          onClick={onCancel}
          disabled={saving}
        >
          Cancel
        </Button>
        <Button small type="submit" disabled={saving}>
          {saving ? 'Saving…' : 'Save event'}
        </Button>
      </div>
    </form>
  )
}
