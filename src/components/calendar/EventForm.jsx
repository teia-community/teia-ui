import { useEffect, useRef, useState, lazy, Suspense } from 'react'
import useSWR from 'swr'
import { Button } from '@atoms/button'
import { Identicon } from '@atoms/identicons'
import { useLocalSettings } from '@context/localSettingsStore'
import { useUserStore } from '@context/userStore'
import { blankEvent } from '@data/calendar/schema'
import { useChannelList } from '@data/messaging/channels'
import { fetchGraphQL, getCollabsForAddress, searchCollabs } from '@data/api'
import { walletPreview } from '@utils/string'
import { msgIpfsToUrl } from '@data/messaging/ipfs'
import { slugify } from '@data/wiki/links'
import { EVENT_COLORS } from '@data/calendar-chain/colors'
import RelatedPicker from './RelatedPicker'
import styles from '@style'

// Load Editor only when the author opts into Markdown formatting.
const MDEditor = lazy(() => import('@uiw/react-md-editor'))

const pad2 = (n) => String(n).padStart(2, '0')
const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1)

// Optional form sections, revealed on demand via the "+ chips" row
const OPTIONAL_SECTIONS = [
  'location',
  'tags',
  'channels',
  'collabs',
  'links',
  'images',
]
const SECTION_LABELS = {
  location: 'Location',
  tags: 'Tags',
  channels: 'Channels',
  collabs: 'Collabs',
  links: 'Links',
  images: 'Images',
}

/** Whether a section already holds content (edit / draft-restore auto-reveal). */
function sectionHasContent(values, key) {
  switch (key) {
    case 'location':
      return Boolean((values.location || '').trim())
    case 'tags':
      return Boolean((values.tags || '').trim())
    case 'channels':
      return (values.channels?.length || 0) > 0
    case 'collabs':
      return (values.collabs?.length || 0) > 0
    case 'links':
      return (values.links || []).some((l) => l.url?.trim() || l.label?.trim())
    case 'images':
      return (values.images || []).some((url) => url?.trim())
    default:
      return false
  }
}

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
 *   takenSlugs?: Map<string, number>,
 *   currentEventId?: number|null,
 * }} props
 */
export default function EventForm({
  initial,
  onSubmit,
  onUploadImage,
  onCancel,
  onValuesChange,
  takenSlugs,
  currentEventId,
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
  const theme = useLocalSettings((st) => st.theme)
  // Description  can be expand into a full Markdown editor
  const [markdownMode, setMarkdownMode] = useState(false)

  const [revealed, setRevealed] = useState(
    () => new Set(OPTIONAL_SECTIONS.filter((k) => sectionHasContent(values, k)))
  )
  const sectionRefs = useRef({})
  const chipRefs = useRef({})
  const pendingFocus = useRef(null)
  useEffect(() => {
    const pending = pendingFocus.current
    if (!pending) return
    pendingFocus.current = null
    if (pending.type === 'section') {
      const section = sectionRefs.current[pending.key]
      // fall back to its add-row action instead of the "Remove" control.
      const target =
        section?.querySelector('input, textarea, select') ||
        [...(section?.querySelectorAll('button') || [])].find(
          (b) => !(b.getAttribute('aria-label') || '').startsWith('Remove')
        ) ||
        section?.querySelector('button')
      target?.focus()
    } else {
      const chip =
        chipRefs.current[pending.key] ||
        OPTIONAL_SECTIONS.map((k) => chipRefs.current[k]).find(Boolean)
      chip?.focus()
    }
  }, [revealed])

  const revealSection = (key) => {
    pendingFocus.current = { type: 'section', key }
    setRevealed((s) => new Set([...s, key]))
  }

  // "Remove" clears the section's values and returns its chip
  const removeSection = (key) => {
    pendingFocus.current = { type: 'chip', key }
    setRevealed((s) => {
      const next = new Set(s)
      next.delete(key)
      return next
    })
    setValues((v) => {
      switch (key) {
        case 'location':
          return { ...v, location: '' }
        case 'tags':
          return { ...v, tags: '' }
        case 'channels':
          return { ...v, channels: [] }
        case 'collabs':
          return { ...v, collabs: [] }
        case 'links':
          return { ...v, links: [] }
        case 'images':
          return { ...v, images: [] }
        default:
          return v
      }
    })
    if (key === 'images') setSelectedImages([])
  }

  // --- linked channels & collabs (both optional, multi-select) -------------
  const userAddress = useUserStore((st) => st.address)
  const { data: channelList } = useChannelList(revealed.has('channels'))
  // Name distinct from the `openPicker` datetime helper below (native
  // showPicker() trigger for the date/time inputs).
  const [activePicker, setActivePicker] = useState(null) // 'channels' | 'collabs' | null
  // Native focus-return is lost when React unmounts the closed <dialog>, so
  // hand focus back to the opener button ourselves.
  const pickerOpenerRefs = useRef({})
  // (Button doesn't forward refs, so the refs sit on wrapper spans.)
  const closePicker = (which) => {
    setActivePicker(null)
    pickerOpenerRefs.current[which]?.querySelector('button')?.focus()
  }
  const channelItems = (channelList || []).map((ch) => ({
    key: String(ch.id),
    id: ch.id,
    name: ch.metadata?.name || `Channel #${ch.id}`,
    meta: ch.metadata?.description || '',
    image: ch.metadata?.image ? msgIpfsToUrl(ch.metadata.image) : undefined,
  }))
  const { data: collabResult } = useSWR(
    userAddress && revealed.has('collabs')
      ? ['calendar-link-collabs', userAddress]
      : null,
    () =>
      fetchGraphQL(getCollabsForAddress, 'GetCollabs', { address: userAddress })
  )
  // Collabs, may be updated, the user can link any collab
  const [collabQuery, setCollabQuery] = useState('')
  const [collabSearchTerm, setCollabSearchTerm] = useState('')
  useEffect(() => {
    const t = setTimeout(() => setCollabSearchTerm(collabQuery.trim()), 300)
    return () => clearTimeout(t)
  }, [collabQuery])
  const collabSearchActive = collabSearchTerm.length >= 2
  const { data: collabSearchResult } = useSWR(
    collabSearchActive ? ['calendar-collab-search', collabSearchTerm] : null,
    () => {
      // Escape LIKE wildcards so a typed % _ \ matches literally.
      const esc = collabSearchTerm.replace(/[\\%_]/g, '\\$&')
      return fetchGraphQL(searchCollabs, 'SearchCollabs', {
        like: `%${esc}%`,
        prefix: `${esc}%`,
      })
    }
  )

  const collabSearchPending =
    collabQuery.trim().length >= 2 &&
    (collabQuery.trim() !== collabSearchTerm ||
      (collabSearchActive && !collabSearchResult))
  const mapCollabRows = (rows) =>
    (rows || []).map((c) => ({
      key: c.contract_address,
      address: c.contract_address,
      name: c.contract_profile?.name || walletPreview(c.contract_address),
      logo: c.contract_profile?.metadata?.data?.identicon || undefined,
      meta: (c.shareholders || [])
        .map(
          (s) =>
            s.shareholder_profile?.name || walletPreview(s.shareholder_address)
        )
        .slice(0, 4)
        .join(', '),
    }))
  const ownCollabItems = mapCollabRows(collabResult?.data?.split_contracts)
  const collabItems = collabSearchActive
    ? mapCollabRows(collabSearchResult?.data?.split_contracts)
    : ownCollabItems.filter((it) =>
        it.name.toLowerCase().includes(collabQuery.trim().toLowerCase())
      )
  const collabLogos = useRef(new Map())
  for (const it of [...ownCollabItems, ...collabItems]) {
    if (it.logo) collabLogos.current.set(it.address, it.logo)
  }
  const selectedChannelKeys = new Set(
    (values.channels || []).map((c) => String(c.id))
  )
  const selectedCollabKeys = new Set(
    (values.collabs || []).map((c) => c.address)
  )
  const channelImageById = new Map(channelItems.map((it) => [it.key, it.image]))

  const toggleChannel = (item, on) =>
    setValues((v) => ({
      ...v,
      channels: on
        ? v.channels.some((c) => String(c.id) === String(item.id))
          ? v.channels
          : [...v.channels, { id: item.id, name: item.name }]
        : v.channels.filter((c) => String(c.id) !== String(item.id)),
    }))
  const toggleCollab = (item, on) =>
    setValues((v) => ({
      ...v,
      collabs: on
        ? v.collabs.some((c) => c.address === item.address)
          ? v.collabs
          : [...v.collabs, { address: item.address, name: item.name }]
        : v.collabs.filter((c) => c.address !== item.address),
    }))

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

  // All Day Toggle
  const toggleAllDay = (on) => {
    if (on === allDay) return
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

  // Live duplicate-name check
  const titleSlug = slugify(values.title || '')
  const titleTaken =
    titleSlug &&
    takenSlugs?.has(titleSlug) &&
    takenSlugs.get(titleSlug) !== currentEventId

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
        <h2 className={styles.form_title}>
          {initial?.id ? 'Edit event' : 'New event'}
        </h2>
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
        {titleTaken && (
          <p className={styles.form_error} role="alert">
            An event named "{values.title}" already exists — please choose a
            different name.
          </p>
        )}
      </label>

      <div className={styles.field}>
        <div className={styles.field_label_row}>
          <span>Description (optional)</span>
          <button
            type="button"
            className={styles.md_toggle}
            aria-pressed={markdownMode}
            onClick={() => setMarkdownMode((m) => !m)}
          >
            {markdownMode ? 'Plain text' : 'Format with Markdown'}
          </button>
        </div>
        {markdownMode ? (
          <div
            className={styles.editor_wrapper}
            data-color-mode={theme === 'dark' ? 'dark' : 'light'}
          >
            <Suspense
              fallback={
                <div className={styles.editor_loading}>Loading editor…</div>
              }
            >
              <MDEditor
                value={values.description}
                onChange={(val) =>
                  setValues((v) => ({ ...v, description: val ?? '' }))
                }
                preview="live"
                height={280}
                textareaProps={{ placeholder: "What's happening?" }}
              />
            </Suspense>
          </div>
        ) : (
          <textarea
            rows={4}
            value={values.description}
            onChange={set('description')}
            placeholder="What's happening?"
          />
        )}
      </div>

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

      <div className={styles.field}>
        <div className={styles.field_label_row}>
          <span>Color</span>
        </div>
        <fieldset className={styles.color_swatches}>
          <legend className={styles.visually_hidden}>Event color</legend>
          {Object.entries(EVENT_COLORS).map(([name, hex]) => (
            <label className={styles.color_option} key={name}>
              <input
                type="radio"
                className={styles.color_input}
                name="event-color"
                value={name}
                required
                checked={values.color === name}
                onChange={() => setValues((v) => ({ ...v, color: name }))}
                aria-label={capitalize(name)}
              />
              <span
                className={styles.color_swatch}
                style={{ background: hex }}
              />
            </label>
          ))}
        </fieldset>
        <p className={styles.color_selected}>
          {values.color ? capitalize(values.color) : 'Pick a color'}
        </p>
      </div>

      {revealed.has('location') && (
        <div
          className={`${styles.field} ${styles.section_reveal}`}
          ref={(el) => (sectionRefs.current.location = el)}
        >
          <div className={styles.field_label_row}>
            <span>Location (max 2)</span>
            <button
              type="button"
              className={styles.md_toggle}
              onClick={() => removeSection('location')}
              aria-label="Remove location"
            >
              Remove
            </button>
          </div>
          <input
            type="text"
            value={values.location}
            onChange={set('location')}
            placeholder="My City, online"
            aria-label="Location"
          />
        </div>
      )}

      {revealed.has('tags') && (
        <div
          className={`${styles.field} ${styles.section_reveal}`}
          ref={(el) => (sectionRefs.current.tags = el)}
        >
          <div className={styles.field_label_row}>
            <span>Tags (max 20)</span>
            <button
              type="button"
              className={styles.md_toggle}
              onClick={() => removeSection('tags')}
              aria-label="Remove tags"
            >
              Remove
            </button>
          </div>
          <input
            type="text"
            value={values.tags || ''}
            onChange={set('tags')}
            placeholder="tag1, tag2, …"
            aria-label="Tags"
          />
        </div>
      )}

      {/* Linked channels */}
      {revealed.has('channels') && (
        <fieldset
          className={`${styles.group} ${styles.section_reveal}`}
          ref={(el) => (sectionRefs.current.channels = el)}
        >
          <legend>Channels</legend>
          <div className={styles.section_remove_row}>
            <button
              type="button"
              className={styles.md_toggle}
              onClick={() => removeSection('channels')}
              aria-label="Remove linked channels"
            >
              Remove
            </button>
          </div>
          <div className={styles.picker_openers}>
            <span ref={(el) => (pickerOpenerRefs.current.channels = el)}>
              <Button
                shadow_box
                small
                secondary
                type="button"
                onClick={() => setActivePicker('channels')}
              >
                Link channels
              </Button>
            </span>
          </div>

          {values.channels.length > 0 && (
            <ul className={styles.related_list}>
              {values.channels.map((c) => {
                const image = channelImageById.get(String(c.id))
                return (
                  <li className={styles.related_row} key={`channel-${c.id}`}>
                    {image ? (
                      <span className={styles.picker_thumb}>
                        <img
                          src={image}
                          alt=""
                          loading="lazy"
                          onError={(e) =>
                            (e.currentTarget.style.display = 'none')
                          }
                        />
                      </span>
                    ) : (
                      <span
                        className={styles.picker_thumb}
                        aria-hidden="true"
                      />
                    )}
                    <span className={styles.related_name}>{c.name}</span>
                    <button
                      type="button"
                      className={styles.md_toggle}
                      aria-label={`Unlink ${c.name}`}
                      onClick={() =>
                        setValues((v) => ({
                          ...v,
                          channels: v.channels.filter(
                            (x) => String(x.id) !== String(c.id)
                          ),
                        }))
                      }
                    >
                      ✕
                    </button>
                  </li>
                )
              })}
            </ul>
          )}

          {activePicker === 'channels' && (
            <RelatedPicker
              title="Channels"
              items={channelItems}
              loading={!channelList}
              error={undefined}
              emptyMessage="No channels found."
              selectedKeys={selectedChannelKeys}
              onToggle={toggleChannel}
              onClose={() => closePicker('channels')}
            />
          )}
        </fieldset>
      )}

      {/* Linked collabs */}
      {revealed.has('collabs') && (
        <fieldset
          className={`${styles.group} ${styles.section_reveal}`}
          ref={(el) => (sectionRefs.current.collabs = el)}
        >
          <legend>Collabs</legend>
          <div className={styles.section_remove_row}>
            <button
              type="button"
              className={styles.md_toggle}
              onClick={() => removeSection('collabs')}
              aria-label="Remove linked collabs"
            >
              Remove
            </button>
          </div>
          <div className={styles.picker_openers}>
            <span ref={(el) => (pickerOpenerRefs.current.collabs = el)}>
              <Button
                shadow_box
                small
                secondary
                type="button"
                onClick={() => {
                  setCollabQuery('')
                  setActivePicker('collabs')
                }}
              >
                Link collabs
              </Button>
            </span>
          </div>

          {values.collabs.length > 0 && (
            <ul className={styles.related_list}>
              {values.collabs.map((c) => (
                <li className={styles.related_row} key={`collab-${c.address}`}>
                  <span className={styles.picker_thumb}>
                    <Identicon
                      address={c.address}
                      logo={collabLogos.current.get(c.address)}
                    />
                  </span>
                  <span className={styles.related_name}>{c.name}</span>
                  <button
                    type="button"
                    className={styles.md_toggle}
                    aria-label={`Unlink ${c.name}`}
                    onClick={() =>
                      setValues((v) => ({
                        ...v,
                        collabs: v.collabs.filter(
                          (x) => x.address !== c.address
                        ),
                      }))
                    }
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}

          {activePicker === 'collabs' && (
            <RelatedPicker
              title="Collabs"
              items={collabItems}
              loading={
                Boolean(userAddress) && !collabResult && !collabSearchActive
              }
              error={undefined}
              emptyMessage={
                collabSearchActive
                  ? 'No collabs match.'
                  : "You're not part of any collabs yet — type to search all collabs."
              }
              gateMessage={
                !userAddress
                  ? 'Connect your wallet to link collabs.'
                  : undefined
              }
              query={collabQuery}
              onQueryChange={setCollabQuery}
              searching={collabSearchPending}
              searchPlaceholder="Wallet, alias or collab name…"
              selectedKeys={selectedCollabKeys}
              onToggle={toggleCollab}
              onClose={() => closePicker('collabs')}
            />
          )}
        </fieldset>
      )}

      {/* Links */}
      {revealed.has('links') && (
        <fieldset
          className={`${styles.group} ${styles.section_reveal}`}
          ref={(el) => (sectionRefs.current.links = el)}
        >
          <legend>Links</legend>
          <div className={styles.section_remove_row}>
            <button
              type="button"
              className={styles.md_toggle}
              onClick={() => removeSection('links')}
              aria-label="Remove links"
            >
              Remove
            </button>
          </div>
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
              <Button
                small
                secondary
                type="button"
                onClick={() => removeLink(i)}
              >
                Remove
              </Button>
            </div>
          ))}
          <Button small secondary type="button" onClick={addLink}>
            + Add link
          </Button>
        </fieldset>
      )}

      {/* Images (carousel) */}
      {revealed.has('images') && (
        <fieldset
          className={`${styles.group} ${styles.section_reveal}`}
          ref={(el) => (sectionRefs.current.images = el)}
        >
          <legend>Images (carousel)</legend>
          <div className={styles.section_remove_row}>
            <button
              type="button"
              className={styles.md_toggle}
              onClick={() => removeSection('images')}
              aria-label="Remove images"
            >
              Remove
            </button>
          </div>
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
              <Button
                shadow_box
                fit
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
      )}

      {/* Reveal chips for the optional sections that are still hidden. */}
      {OPTIONAL_SECTIONS.some((k) => !revealed.has(k)) && (
        <div className={styles.add_row}>
          <span className={styles.add_row_label}>Add to your event:</span>
          <div className={styles.add_row_chips}>
            {OPTIONAL_SECTIONS.filter((k) => !revealed.has(k)).map((k) => (
              <button
                key={k}
                type="button"
                className={styles.mode_chip}
                ref={(el) => (chipRefs.current[k] = el)}
                onClick={() => revealSection(k)}
              >
                + {SECTION_LABELS[k]}
              </button>
            ))}
          </div>
        </div>
      )}

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
          disabled={saving || uploadingImages || titleTaken}
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
