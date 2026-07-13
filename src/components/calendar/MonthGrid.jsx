import { useMemo, useRef, useState } from 'react'
import { Button } from '@atoms/button'
import { localDayKey } from '@utils/datetime'
import CalendarEventCard from './CalendarEventCard'
import styles from '@style'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

const pad = (n) => String(n).padStart(2, '0')
const keyOf = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`

// Visual Calendar update for testing purpose
// Max event bars shown per day before collapsing the rest into a "+N" marker.
const MAX_LANES = 4

// Every week reserves this many lane rows regardless of how many events are
// shown, so the grid height stays steady across months and source filters
// (e.g. toggling the TTC calendar). Sized for the worst case: MAX_LANES bars
// plus one "+N" overflow row.
const GRID_LANE_ROWS = MAX_LANES + 1

// Deterministic bar palette. Colors carry no meaning for now
const BAR_COLORS = [
  '#4a90d9', // blue
  '#9b7ede', // purple
  '#4a9d7f', // green
  '#d99a4a', // orange
  '#3aa8a8', // teal
  '#c96a9b', // pink
  '#8a8f98', // gray
  '#c95a5a', // red
]

/** Stable color for an event: a recurring series shares one color (keyed on its
 *  on-chain eventId); WordPress events fall back to their unique id. */
function colorFor(ev) {
  const seed = ev.eventId != null ? `chain-${ev.eventId}` : ev.id || ev.title
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0
  return BAR_COLORS[h % BAR_COLORS.length]
}

/**
 * Bucket events by day key (YYYY-MM-DD). Multi-day events (endDate after
 * startDate) appear on every day they span, capped at 31 days.
 */
function eventsByDay(events) {
  const map = {}
  for (const ev of events) {
    if (!ev.startDate) continue
    const start = localDayKey(ev.startDate)
    const end = localDayKey(ev.endDate || ev.startDate)
    const cursor = new Date(`${start}T00:00:00`)
    const stop = new Date(`${end}T00:00:00`)
    for (let i = 0; i <= 31 && cursor <= stop; i++) {
      const key = keyOf(
        cursor.getFullYear(),
        cursor.getMonth(),
        cursor.getDate()
      )
      if (!map[key]) map[key] = []
      map[key].push(ev)
      cursor.setDate(cursor.getDate() + 1)
    }
  }
  return map
}

const DAY_MS = 86400000

function layoutBars(events, year, month, startOffset, daysInMonth) {
  const firstMs = new Date(year, month, 1).getTime()
  const lastMs = new Date(year, month, daysInMonth).getTime()

  const spans = []
  for (const ev of events) {
    if (!ev.startDate) continue
    const sKey = localDayKey(ev.startDate)
    if (!sKey) continue
    const eKey = localDayKey(ev.endDate || ev.startDate) || sKey
    const sMs = new Date(`${sKey}T00:00:00`).getTime()
    let eMs = new Date(`${eKey}T00:00:00`).getTime()
    if (Number.isNaN(sMs)) continue
    if (Number.isNaN(eMs) || eMs < sMs) eMs = sMs
    if (eMs < firstMs || sMs > lastMs) continue // not visible this month
    // Clamp the span to the month, then map to grid cell indices.
    const startDay = Math.round((Math.max(sMs, firstMs) - firstMs) / DAY_MS) + 1
    const endDay = Math.round((Math.min(eMs, lastMs) - firstMs) / DAY_MS) + 1
    spans.push({
      ev,
      startCell: startOffset + startDay - 1,
      endCell: startOffset + endDay - 1,
      lane: 0,
      color: colorFor(ev),
    })
  }

  // Teia events are packed first
  const isTeia = (sp) => sp.ev.source === 'chain'
  spans.sort(
    (a, b) =>
      Number(isTeia(b)) - Number(isTeia(a)) ||
      a.startCell - b.startCell ||
      b.endCell - b.startCell - (a.endCell - a.startCell)
  )

  const totalCells = startOffset + daysInMonth
  const occupancy = [] // occupancy[lane][cell] = taken?
  for (const sp of spans) {
    let lane = 0
    for (;;) {
      if (!occupancy[lane]) occupancy[lane] = new Array(totalCells).fill(false)
      let free = true
      for (let c = sp.startCell; c <= sp.endCell; c++) {
        if (occupancy[lane][c]) {
          free = false
          break
        }
      }
      if (free) {
        for (let c = sp.startCell; c <= sp.endCell; c++)
          occupancy[lane][c] = true
        break
      }
      lane++
    }
    sp.lane = lane
  }

  return { spans }
}

/**
 * Month-view calendar: days with events are clickable and open a popup dialog
 * (native <dialog>) listing that day's events. Reuses CalendarEventCard, so
 * admin edit/delete works from inside the popup too.
 *
 * @param {{
 *   events: import('@data/calendar/schema').CalendarEvent[],
 *   roles?: { canModerate?: boolean, canPropose?: boolean },
 *   onEdit?: (event: any) => void,
 *   onHide?: (event: any) => void,
 *   onProposeEdit?: (event: any) => void,
 * }} props
 */
export default function MonthGrid({
  events,
  roles,
  onEdit,
  onHide,
  onProposeEdit,
}) {
  const today = new Date()
  const [view, setView] = useState({
    year: today.getFullYear(),
    month: today.getMonth(),
  })
  const [selected, setSelected] = useState(null)
  const dialogRef = useRef(null)

  const byDay = useMemo(() => eventsByDay(events), [events])

  const { year, month } = view
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const startOffset = new Date(year, month, 1).getDay()
  const todayKey = keyOf(today.getFullYear(), today.getMonth(), today.getDate())

  // Leading blanks + day numbers, padded to whole weeks.
  const cells = [
    ...Array.from({ length: startOffset }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  // Bar layout for the month, sliced into week rows for rendering.
  const { weeks, monthRows } = useMemo(() => {
    const { spans } = layoutBars(events, year, month, startOffset, daysInMonth)
    // Per-cell count of bars pushed past MAX_LANES (rendered as "+N").
    const hiddenByCell = {}
    for (const sp of spans) {
      if (sp.lane < MAX_LANES) continue
      for (let c = sp.startCell; c <= sp.endCell; c++)
        hiddenByCell[c] = (hiddenByCell[c] || 0) + 1
    }
    const rows = []
    for (let wStart = 0; wStart < cells.length; wStart += 7) {
      const wEnd = wStart + 6
      const weekSpans = spans.filter(
        (sp) =>
          sp.lane < MAX_LANES && sp.startCell <= wEnd && sp.endCell >= wStart
      )
      let lanes = 0
      for (const sp of weekSpans) lanes = Math.max(lanes, sp.lane + 1)
      let overflow = false
      for (let d = wStart; d <= wEnd; d++) if (hiddenByCell[d]) overflow = true
      rows.push({ wStart, weekSpans, lanes, overflow, hiddenByCell })
    }

    // Fixed so the grid height never changes with event count or filters.
    return { weeks: rows, monthRows: GRID_LANE_ROWS }
    // cells is derived from the same inputs, so this list keys the memo.
  }, [events, year, month, startOffset, daysInMonth, cells.length])

  const step = (delta) =>
    setView(({ year, month }) => {
      const d = new Date(year, month + delta, 1)
      return { year: d.getFullYear(), month: d.getMonth() }
    })

  const openDay = (key) => {
    setSelected(key)
    dialogRef.current?.showModal()
  }
  const closeDialog = () => dialogRef.current?.close()

  // Close when the backdrop (the dialog element itself) is clicked.
  const onDialogClick = (e) => {
    if (e.target === dialogRef.current) closeDialog()
  }

  // Teia events first
  const selectedEvents = [...((selected && byDay[selected]) || [])].sort(
    (a, b) => Number(b.source === 'chain') - Number(a.source === 'chain')
  )
  const selectedLabel = selected
    ? new Date(`${selected}T00:00:00`).toLocaleDateString(undefined, {
        dateStyle: 'full',
      })
    : ''

  return (
    <div className={styles.month}>
      <div className={styles.month_nav}>
        <Button small secondary alt="Previous month" onClick={() => step(-1)}>
          ‹
        </Button>
        <span className={styles.month_title} aria-live="polite">
          {MONTHS[month]} {year}
        </span>
        <Button small secondary alt="Next month" onClick={() => step(1)}>
          ›
        </Button>
      </div>

      <div className={styles.weekdays} aria-hidden="true">
        {WEEKDAYS.map((d) => (
          <span key={d} className={styles.weekday}>
            {d}
          </span>
        ))}
      </div>

      <div className={styles.grid} role="grid" aria-label="Calendar of events">
        {weeks.map(({ wStart, weekSpans, lanes, overflow, hiddenByCell }) => {
          return (
            <div
              key={wStart}
              className={styles.week}
              style={{
                gridTemplateRows: `minmax(var(--cal-daynum-h, 2.6em), auto) repeat(${monthRows}, var(--cal-bar-track, 12px))`,
              }}
            >
              {Array.from({ length: 7 }, (_, di) => {
                const day = cells[wStart + di]
                const gridPos = { gridColumn: di + 1, gridRow: '1 / -1' }
                if (day === null) {
                  return (
                    <span
                      key={`blank-${di}`}
                      className={styles.day_blank}
                      style={gridPos}
                    />
                  )
                }
                const key = keyOf(year, month, day)
                const count = byDay[key]?.length || 0
                const classes = [
                  styles.day,
                  key === todayKey ? styles.day_today : '',
                  count ? styles.day_has_events : '',
                ].join(' ')
                return (
                  <button
                    key={key}
                    type="button"
                    className={classes}
                    style={gridPos}
                    disabled={!count}
                    onClick={() => openDay(key)}
                    aria-label={`${MONTHS[month]} ${day}, ${count} event${
                      count === 1 ? '' : 's'
                    }`}
                  >
                    <span className={styles.day_number}>{day}</span>
                  </button>
                )
              })}

              {weekSpans.map((sp) => {
                const startCol = Math.max(sp.startCell, wStart) - wStart + 1
                const endCol = Math.min(sp.endCell, wStart + 6) - wStart + 1
                return (
                  <span
                    key={sp.ev.id}
                    className={[
                      styles.bar,
                      sp.ev.hidden ? styles.bar_hidden : '',
                    ].join(' ')}
                    aria-hidden="true"
                    style={{
                      gridColumn: `${startCol} / ${endCol + 1}`,
                      gridRow: sp.lane + 2,
                      background: sp.color,
                    }}
                  >
                    <span className={styles.bar_title}>
                      {sp.ev.title}
                      {sp.ev.hidden ? ' · hidden' : ''}
                    </span>
                  </span>
                )
              })}

              {overflow &&
                Array.from({ length: 7 }, (_, di) => {
                  const hidden = hiddenByCell[wStart + di]
                  if (!hidden) return null
                  return (
                    <span
                      key={`more-${di}`}
                      className={styles.more}
                      aria-hidden="true"
                      style={{ gridColumn: di + 1, gridRow: lanes + 2 }}
                    >
                      +{hidden}
                    </span>
                  )
                })}
            </div>
          )
        })}
      </div>

      {/* Day popup — native <dialog> gives focus trap, Esc and backdrop. */}
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/click-events-have-key-events */}
      <dialog
        ref={dialogRef}
        className={styles.dialog}
        onClick={onDialogClick}
        onClose={() => setSelected(null)}
        aria-label={`Events on ${selectedLabel}`}
      >
        <div className={styles.dialog_top}>
          <strong>{selectedLabel}</strong>
          <Button small secondary type="button" onClick={closeDialog}>
            Close
          </Button>
        </div>
        {selectedEvents.length === 0 ? (
          <p className={styles.empty}>No events this day.</p>
        ) : (
          selectedEvents.map((event) => (
            <CalendarEventCard
              key={event.id}
              event={event}
              roles={roles}
              truncateDescription
              linkToEvent
              onEdit={(ev) => {
                closeDialog()
                onEdit?.(ev)
              }}
              onHide={onHide}
              onProposeEdit={(ev) => {
                closeDialog()
                onProposeEdit?.(ev)
              }}
            />
          ))
        )}
      </dialog>
    </div>
  )
}
