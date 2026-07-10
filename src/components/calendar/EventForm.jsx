import { useEffect, useState } from 'react'
import { Button } from '@atoms/button'
import { blankEvent } from '@data/calendar/schema'
import styles from '@style'

const pad2 = (n) => String(n).padStart(2, '0')

/**
 * The date (`YYYY-MM-DD`) of the final occurrence of a recurring series, from
 * its start date, frequency, interval and total number of events. The series
 * only ever ends "after N times" now, so the end date is derived, not entered.
 * Returns '' when the start isn't a plain date-shaped value.
 */
function seriesEndDate(startDate, freq, interval, count) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(startDate || ''))
  if (!m) return ''
  const steps = (Math.max(1, count) - 1) * Math.max(1, interval)
  const dt = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
  if (freq === 'DAILY') dt.setDate(dt.getDate() + steps)
  else if (freq === 'WEEKLY') dt.setDate(dt.getDate() + steps * 7)
  else if (freq === 'MONTHLY') dt.setMonth(dt.getMonth() + steps)
  else if (freq === 'YEARLY') dt.setFullYear(dt.getFullYear() + steps)
  else return ''
  return `${dt.getFullYear()}-${pad2(dt.getMonth() + 1)}-${pad2(dt.getDate())}`
}

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
 *   onValuesChange?: (values: any) => void,
 * }} props
 */
export default function EventForm({
  initial,
  onSubmit,
  onUploadImage,
  onCancel,
  onValuesChange,
}) {
  const [values, setValues] = useState(() => ({ ...blankEvent(), ...initial }))
  const [saving, setSaving] = useState(false)
  const [uploadingImages, setUploadingImages] = useState(false)
  const [selectedImages, setSelectedImages] = useState([])
  const [formError, setFormError] = useState(null)
  // Bare YYYY-MM-DD start/end means an all-day event, derived once so
  // editing an existing (or draft-restored) all-day event shows it checked.
  const [allDay, setAllDay] = useState(() =>
    /^\d{4}-\d{2}-\d{2}$/.test(values.startDate)
  )

  useEffect(() => {
    onValuesChange?.(values)
  }, [values, onValuesChange])

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

  // Keep start/end in sync with the input type: truncate to a bare date going
  // into all-day, restore a time going out so the shapes never mix.
  const toggleAllDay = (on) => {
    setAllDay(on)
    setValues((v) => ({
      ...v,
      startDate: on
        ? v.startDate.slice(0, 10)
        : v.startDate
        ? `${v.startDate}T00:00`
        : v.startDate,
      endDate: on
        ? v.endDate.slice(0, 10)
        : v.endDate
        ? `${v.endDate}T00:00`
        : v.endDate,
    }))
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
      // A repeating event ends "after N times"; its end is the derived series
      // end, not a per-occurrence end, so drop any hand-entered endDate.
      endDate: on ? '' : v.endDate,
      recurrence: on ? { freq: 'WEEKLY', interval: 1, count: 1 } : undefined,
    }))
  const setRec = (patch) =>
    setValues((v) => ({ ...v, recurrence: { ...v.recurrence, ...patch } }))

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
    const count = Math.max(1, Number(rec.count) || 1)
    const times = `${count} ${count === 1 ? 'event' : 'events'}`
    const end = seriesEndDate(values.startDate, rec.freq, n, count)
    return end
      ? `Repeats ${adverb} — ${times} (ends ${end})`
      : `Repeats ${adverb} — ${times}`
  }

  // While repeating, the End field is derived (last occurrence's date) and
  // read-only, it mirrors the calculated series end, keeping the start's time
  // of day for timed events so the shape matches the Start input.
  const repInterval = Math.max(1, Number(rec?.interval) || 1)
  const repCount = Math.max(1, Number(rec?.count) || 1)
  const seriesEnd = enabled
    ? seriesEndDate(values.startDate, rec.freq, repInterval, repCount)
    : ''
  const endFieldValue = !enabled
    ? values.endDate
    : seriesEnd
    ? allDay
      ? seriesEnd
      : `${seriesEnd}T${values.startDate.slice(11, 16) || '00:00'}`
    : ''

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
    // Comma-separated, deduped, trimmed list (order preserved).
    const parseList = (str) => {
      const seen = new Set()
      const list = []
      for (const raw of (str || '').split(',')) {
        const t = raw.trim()
        if (t && !seen.has(t)) {
          seen.add(t)
          list.push(t)
        }
      }
      return list
    }
    const locations = parseList(values.location)
    if (locations.length > 2) {
      setFormError('Maximum 2 locations')
      return
    }
    const tags = parseList(values.tags)
    if (tags.length > 20) {
      setFormError('Maximum 20 tags')
      return
    }
    setSaving(true)
    try {
      // Pin any selected files to IPFS before saving.
      let images = values.images
      if (selectedImages.length > 0 && onUploadImage) {
        setUploadingImages(true)
        try {
          const uploaded = []
          for (const file of selectedImages) {
            const result = await onUploadImage(file)
            if (result?.url) uploaded.push(result.url)
          }
          images = [...images, ...uploaded]
          setValues((v) => ({ ...v, images }))
          setSelectedImages([])
        } catch (err) {
          setFormError(`Could not upload image: ${err.message}`)
          return
        } finally {
          setUploadingImages(false)
        }
      }

      // The series end is derived from start + count; it belongs to the
      // recurrence rule (as `until`), not the per-occurrence `endDate`, which
      // stays empty so occurrences don't each span the whole series.
      const recInterval = Math.max(1, Number(values.recurrence?.interval) || 1)
      const recCount = Math.max(1, Number(values.recurrence?.count) || 1)
      const recUntil = values.recurrence?.freq
        ? seriesEndDate(
            values.startDate,
            values.recurrence.freq,
            recInterval,
            recCount
          )
        : ''

      // Drop empty rows before saving.
      const cleaned = {
        ...values,
        locations,
        tags,
        links: values.links.filter((l) => l.url.trim()),
        images: images.filter((url) => url.trim()),
        endDate: values.recurrence?.freq ? '' : values.endDate,
        recurrence: values.recurrence?.freq
          ? {
              freq: values.recurrence.freq,
              interval: recInterval,
              count: recCount,
              ...(recUntil ? { until: recUntil } : {}),
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

      <label className={styles.field}>
        <span>Description</span>
        <textarea
          rows={4}
          value={values.description}
          onChange={set('description')}
          placeholder="What's happening?"
        />
      </label>

      {/* Consolidated date/time mode: All day / Set time are exclusive; Repeat
          is an independent toggle that reveals the recurrence controls. */}
      <div className={styles.mode_row}>
        <button
          type="button"
          className={`${styles.mode_chip} ${
            allDay ? styles.mode_chip_active : ''
          }`}
          aria-pressed={allDay}
          onClick={() => toggleAllDay(true)}
        >
          All day
        </button>
        <button
          type="button"
          className={`${styles.mode_chip} ${
            !allDay ? styles.mode_chip_active : ''
          }`}
          aria-pressed={!allDay}
          onClick={() => toggleAllDay(false)}
        >
          Set time
        </button>
        <button
          type="button"
          className={`${styles.mode_chip} ${
            enabled ? styles.mode_chip_active : ''
          }`}
          aria-pressed={enabled}
          onClick={() => toggleRepeat(!enabled)}
        >
          {enabled ? '✓ Repeat' : 'Repeat'}
        </button>
      </div>

      <div className={styles.field_row}>
        <label className={styles.field}>
          <span>Starts</span>
          <input
            type={allDay ? 'date' : 'datetime-local'}
            required
            value={values.startDate}
            onChange={set('startDate')}
            onClick={openPicker}
          />
        </label>
        <label className={styles.field}>
          <span>{enabled ? 'Ends (auto)' : 'Ends (optional)'}</span>
          <input
            type={allDay ? 'date' : 'datetime-local'}
            value={endFieldValue}
            onChange={set('endDate')}
            onClick={enabled ? undefined : openPicker}
            disabled={enabled}
          />
        </label>
      </div>

      {/* Recurrence — occurrences are generated from the Start date above. */}
      {enabled && (
        <fieldset className={styles.group}>
          <legend>Repeat</legend>
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
              <option value="DAILY">{plural(rec.interval || 1, 'day')}</option>
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
            <span>Ends after</span>
            <input
              type="number"
              min="1"
              value={rec.count || 1}
              onChange={(e) => setRec({ count: Number(e.target.value) })}
              aria-label="Repeat count"
            />
            <span>times</span>
          </div>

          {repeatSummary() && (
            <p className={styles.repeat_summary}>{repeatSummary()}</p>
          )}
        </fieldset>
      )}

      <label className={styles.field}>
        <span>Location (optional, max 2)</span>
        <input
          type="text"
          value={values.location}
          onChange={set('location')}
          placeholder="My City, online"
        />
      </label>

      <label className={styles.field}>
        <span>Tags (optional, max 20)</span>
        <input
          type="text"
          value={values.tags || ''}
          onChange={set('tags')}
          placeholder="tag1, tag2, …"
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
          {uploadingImages
            ? 'Uploading images…'
            : saving
            ? 'Saving…'
            : 'Save event'}
        </Button>
      </div>
    </form>
  )
}
