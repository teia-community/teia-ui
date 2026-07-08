import { useState } from 'react'
import { Button } from '@atoms/button'
import { blankEvent } from '@data/calendar/schema'
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
 *   onUploadImage?: (file: File) => Promise<{ url: string }>,
 *   onCancel: () => void,
 * }} props
 */
export default function EventForm({
  initial,
  onSubmit,
  onUploadImage,
  onCancel,
}) {
  const [values, setValues] = useState(() => ({ ...blankEvent(), ...initial }))
  const [saving, setSaving] = useState(false)
  const [uploadingImages, setUploadingImages] = useState(false)
  const [selectedImages, setSelectedImages] = useState([])
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
  const setImageFiles = (e) => setSelectedImages([...e.target.files])
  const uploadImages = async () => {
    if (!onUploadImage || selectedImages.length === 0 || uploadingImages) return
    setFormError(null)
    setUploadingImages(true)
    try {
      const uploaded = []
      for (const file of selectedImages) {
        const result = await onUploadImage(file)
        if (result?.url) uploaded.push(result.url)
      }
      setValues((v) => ({ ...v, images: [...v.images, ...uploaded] }))
      setSelectedImages([])
    } catch (e) {
      setFormError(`Could not upload image: ${e.message}`)
    } finally {
      setUploadingImages(false)
    }
  }
  const addImage = () => setValues((v) => ({ ...v, images: [...v.images, ''] }))
  const setImage = (i) => (e) =>
    setValues((v) => ({
      ...v,
      images: v.images.map((url, idx) => (idx === i ? e.target.value : url)),
    }))
  const removeImage = (i) =>
    setValues((v) => ({ ...v, images: v.images.filter((_, idx) => idx !== i) }))

  // --- recurrence ---------------------------------------------------------
  const rec = values.recurrence
  const enabled = Boolean(rec)
  const endMode = rec?.count != null ? 'count' : 'until'
  const UNIT = {
    DAILY: 'day',
    WEEKLY: 'week',
    MONTHLY: 'month',
    YEARLY: 'year',
  }
  const plural = (n, unit) => `${unit}${Number(n) === 1 ? '' : 's'}`

  const toggleRepeat = (on) =>
    setValues((v) => ({
      ...v,
      // End is required, so a fresh rule starts on the "until a date" mode.
      recurrence: on ? { freq: 'WEEKLY', interval: 1, until: '' } : undefined,
    }))
  const setRec = (patch) =>
    setValues((v) => ({ ...v, recurrence: { ...v.recurrence, ...patch } }))
  const setEndMode = (mode) =>
    setValues((v) => ({
      ...v,
      recurrence: {
        ...v.recurrence,
        until: mode === 'until' ? v.recurrence?.until || '' : undefined,
        count: mode === 'count' ? v.recurrence?.count || 1 : undefined,
      },
    }))

  /** Plain-language summary shown under the repeat controls. */
  const repeatSummary = () => {
    if (!rec) return ''
    const n = Math.max(1, Number(rec.interval) || 1)
    const adverb =
      n === 1
        ? {
            DAILY: 'daily',
            WEEKLY: 'weekly',
            MONTHLY: 'monthly',
            YEARLY: 'yearly',
          }[rec.freq]
        : `every ${n} ${plural(n, UNIT[rec.freq])}`
    if (endMode === 'count' && rec.count) {
      return `Repeats ${adverb} — ${rec.count} events`
    }
    if (endMode === 'until' && rec.until) {
      return `Repeats ${adverb} until ${rec.until}`
    }
    return `Repeats ${adverb}`
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    // Button's `disabled` prop is style-only, so guard re-entry here.
    if (saving || uploadingImages) return
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
    if (values.recurrence) {
      const r = values.recurrence
      if (!r.until && !r.count) {
        setFormError(
          'Choose when the repeat ends — a date or a number of times.'
        )
        return
      }
      if (
        r.until &&
        values.startDate &&
        r.until.slice(0, 10) < values.startDate.slice(0, 10)
      ) {
        setFormError('The repeat end date must be on or after the start.')
        return
      }
    }
    setSaving(true)
    try {
      // Drop empty rows before saving.
      const cleaned = {
        ...values,
        links: values.links.filter((l) => l.url.trim()),
        images: values.images.filter((url) => url.trim()),
        recurrence: values.recurrence?.freq
          ? {
              freq: values.recurrence.freq,
              interval: Math.max(1, Number(values.recurrence.interval) || 1),
              ...(values.recurrence.until
                ? { until: values.recurrence.until }
                : {}),
              ...(values.recurrence.count
                ? { count: Math.max(1, Number(values.recurrence.count)) }
                : {}),
            }
          : undefined,
      }
      await onSubmit(cleaned)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.form_top}>
        <strong>{initial?.id ? 'Edit event' : 'New event'}</strong>
        <Button
          className={styles.form_close}
          type="button"
          onClick={onCancel}
          alt="Close"
        >
          ✕
        </Button>
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

      {/* Recurrence — occurrences are generated from the Start date above. */}
      <fieldset className={styles.group}>
        <legend>Repeat</legend>
        <div className={styles.repeat_toggle}>
          <Button
            shadow_box
            fit
            type="button"
            onClick={() => toggleRepeat(!enabled)}
          >
            {enabled ? '✓ Repeating' : 'Repeat this event'}
          </Button>
        </div>

        {enabled && (
          <>
            <div className={styles.repeat_line}>
              <span>Every</span>
              <input
                type="number"
                min="1"
                value={rec.interval || 1}
                onChange={(e) => setRec({ interval: Number(e.target.value) })}
                aria-label="Repeat interval"
              />
              <select
                value={rec.freq}
                onChange={(e) => setRec({ freq: e.target.value })}
                aria-label="Repeat unit"
              >
                <option value="DAILY">
                  {plural(rec.interval || 1, 'day')}
                </option>
                <option value="WEEKLY">
                  {plural(rec.interval || 1, 'week')}
                </option>
                <option value="MONTHLY">
                  {plural(rec.interval || 1, 'month')}
                </option>
                <option value="YEARLY">
                  {plural(rec.interval || 1, 'year')}
                </option>
              </select>
            </div>

            <div className={styles.repeat_line}>
              <span>Ends</span>
              <label
                className={`${styles.repeat_radio} ${
                  endMode === 'until' ? styles.repeat_radio_active : ''
                }`}
              >
                <input
                  type="checkbox"
                  checked={endMode === 'until'}
                  onChange={() => setEndMode('until')}
                />
                <span>on</span>
              </label>
              <input
                type="date"
                value={rec.until || ''}
                disabled={endMode !== 'until'}
                min={(values.startDate || '').slice(0, 10)}
                onChange={(e) => setRec({ until: e.target.value })}
                aria-label="Repeat until date"
              />
              <label
                className={`${styles.repeat_radio} ${
                  endMode === 'count' ? styles.repeat_radio_active : ''
                }`}
              >
                <input
                  type="checkbox"
                  checked={endMode === 'count'}
                  onChange={() => setEndMode('count')}
                />
                <span>after</span>
              </label>
              <input
                type="number"
                min="1"
                value={rec.count || 1}
                disabled={endMode !== 'count'}
                onChange={(e) => setRec({ count: Number(e.target.value) })}
                aria-label="Repeat count"
              />
              <span>times</span>
            </div>

            {repeatSummary() && (
              <p className={styles.repeat_summary}>{repeatSummary()}</p>
            )}
          </>
        )}
      </fieldset>

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
        {onUploadImage && (
          <div className={styles.repeat_row}>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={setImageFiles}
              aria-label="Upload event images"
            />
            <Button
              shadow_box
              fit
              type="button"
              onClick={uploadImages}
              disabled={uploadingImages || selectedImages.length === 0}
            >
              {uploadingImages ? 'Uploading...' : 'Upload'}
            </Button>
          </div>
        )}
        {values.images.map((url, i) => (
          <div className={styles.repeat_row} key={i}>
            <input
              type="url"
              value={url}
              onChange={setImage(i)}
              placeholder="https://…/image.png"
              aria-label={`Image ${i + 1} URL`}
            />
            <Button shadow_box fit type="button" onClick={() => removeImage(i)}>
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
          shadow_box
          fit
          type="button"
          onClick={onCancel}
          disabled={saving || uploadingImages}
        >
          Cancel
        </Button>
        <Button
          shadow_box
          fit
          type="submit"
          disabled={saving || uploadingImages}
        >
          {saving ? 'Saving…' : 'Save event'}
        </Button>
      </div>
    </form>
  )
}
