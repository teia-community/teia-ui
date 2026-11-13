import { useEffect, useMemo, useRef, useState } from 'react'
import { Button } from '@atoms/button'
import { eventColorHex } from '@data/calendar-chain/colors'
import { localDayKey } from '@utils/datetime'
import CalendarEventCard from './CalendarEventCard'
import styles from '@style'
import tourStyles from '@components/tour/index.module.scss'

export const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
export const MONTHS = [
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
export const keyOf = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`

// Visual Calendar update for testing purpose
// Max event bars shown per day before collapsing the rest into a "+N" marker.
const MAX_LANES = 4

// Every week reserves this many lane rows regardless of how many events are
// shown, so the grid height stays steady across months and source filters
// (e.g. toggling the TTC calendar). Sized for the worst case: MAX_LANES bars
// plus one "+N" overflow row.
const GRID_LANE_ROWS = MAX_LANES + 1

// Bar shade by duration: light for single-day, dark for multi-day.
const SINGLE_DAY_COLOR = 'var(--gray-60)'
const MULTI_DAY_COLOR = 'var(--gray-100)'

/**
 * Bucket events by day key (YYYY-MM-DD). Multi-day events (endDate after
 * startDate) appear on every day they span, capped at 31 days.
 */
export function eventsByDay(events) {
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

// Hover devices expand bars on hover (CSS); touch expands on a first tap.
const HAS_HOVER =
  typeof window !== 'undefined'
    ? window.matchMedia('(hover: hover)')
    : { matches: false }

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
    const cellOf = (ms) => startOffset + Math.round((ms - firstMs) / DAY_MS)
    const push = (ms, cap) =>
      spans.push({
        ev,
        startCell: cellOf(ms),
        endCell: cellOf(ms),
        lane: 0,
        color: cap ? MULTI_DAY_COLOR : SINGLE_DAY_COLOR,
        cap,
      })
    // Multi-day events only mark their start and end days, leaving the days
    // between free for other events (the day popup still lists them).
    if (sMs === eMs) push(sMs, null)
    else {
      if (sMs >= firstMs) push(sMs, 'start')
      if (eMs <= lastMs) push(eMs, 'end')
    }
  }

  // Teia events are packed first
  const isTeia = (sp) => sp.ev.source === 'chain' || !!sp.ev.teia_event
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
 *   horizon?: string,
 *   extending?: boolean,
 *   onExtendHorizon?: () => void,
 * }} props
 */
export default function MonthGrid({
  events,
  roles,
  onEdit,
  onHide,
  onProposeEdit,
  horizon,
  extending,
  onExtendHorizon,
}) {
  const today = new Date()
  const [view, setView] = useState({
    year: today.getFullYear(),
    month: today.getMonth(),
  })
  const [selected, setSelected] = useState(null)
  const dialogRef = useRef(null)
  // Event a bar click targets: the day popup scrolls to and highlights it.
  const [focusId, setFocusId] = useState(null)

  useEffect(() => {
    if (!selected || !focusId) return
    dialogRef.current
      ?.querySelector(`[data-event-id="${CSS.escape(focusId)}"]`)
      ?.scrollIntoView({ block: 'start' })
  }, [selected, focusId])

  // Bar expanded by a click to reveal its "?" trigger, keyed `${ev.id}-${cap}`.
  const [openBar, setOpenBar] = useState(null)

  // Any press outside the expanded bar collapses it.
  useEffect(() => {
    if (!openBar) return
    const onDown = (e) => {
      if (!e.target.closest?.(`.${styles.bar_open}`)) setOpenBar(null)
    }
    document.addEventListener('pointerdown', onDown)
    return () => document.removeEventListener('pointerdown', onDown)
  }, [openBar])

  const byDay = useMemo(() => eventsByDay(events), [events])

  const { year, month } = view
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const startOffset = new Date(year, month, 1).getDay()
  const todayKey = keyOf(today.getFullYear(), today.getMonth(), today.getDate())

  const pastHorizon =
    Boolean(horizon) && keyOf(year, month, daysInMonth) > horizon

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

  const step = (delta) => {
    setOpenBar(null)
    setView(({ year, month }) => {
      const d = new Date(year, month + delta, 1)
      return { year: d.getFullYear(), month: d.getMonth() }
    })
  }

  const openDay = (key, eventId = null) => {
    setOpenBar(null)
    setSelected(key)
    setFocusId(eventId)
    dialogRef.current?.showModal()
  }
  const closeDialog = () => dialogRef.current?.close()

  // Close when the backdrop (the dialog element itself) is clicked.
  const onDialogClick = (e) => {
    if (e.target === dialogRef.current) closeDialog()
  }

  // Teia events first
  const selectedEvents = [...((selected && byDay[selected]) || [])].sort(
    (a, b) =>
      Number(b.source === 'chain' || !!b.teia_event) -
      Number(a.source === 'chain' || !!a.teia_event)
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
                    // Tour target; the tour spotlights the first match.
                    data-tour={count ? 'day' : undefined}
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
                const accent = eventColorHex(sp.ev.color)
                // Bars are single-cell, so the start cell is the bar's day.
                const dayKey = keyOf(
                  year,
                  month,
                  sp.startCell - startOffset + 1
                )
                const barKey = `${sp.ev.id}-${sp.cap}`
                const isOpen = openBar === barKey
                return (
                  // Hover (or a first tap on touch) expands the bar to show its
                  // "?", which opens the day popup at this event; clicking the
                  // bar itself opens the day popup as usual. Keyboard users
                  // reach the same events via the day buttons.
                  // eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events
                  <span
                    key={barKey}
                    data-tour="bar"
                    onClick={() =>
                      isOpen || HAS_HOVER.matches
                        ? openDay(dayKey)
                        : setOpenBar(barKey)
                    }
                    className={[
                      styles.bar,
                      sp.ev.hidden ? styles.bar_hidden : '',
                      sp.cap === 'start' ? styles.bar_start : '',
                      sp.cap === 'end' ? styles.bar_end : '',
                      isOpen ? styles.bar_open : '',
                    ].join(' ')}
                    aria-hidden={!isOpen}
                    style={{
                      gridColumn: `${startCol} / ${endCol + 1}`,
                      gridRow: sp.lane + 2,
                      '--bar-bg': sp.color,
                      ...(accent ? { borderLeft: `4px solid ${accent}` } : {}),
                    }}
                  >
                    <span className={styles.bar_title}>
                      {sp.ev.teia_event && (
                        <img
                          src="/teia-frame.svg"
                          alt=""
                          className={styles.teia_mark}
                        />
                      )}
                      {sp.ev.title}
                      {sp.ev.hidden ? ' · hidden' : ''}
                    </span>
                    <button
                      type="button"
                      tabIndex={-1}
                      className={`${tourStyles.help} ${tourStyles.blink} ${styles.bar_help}`}
                      aria-label={`Show ${sp.ev.title}`}
                      onClick={(e) => {
                        e.stopPropagation()
                        openDay(dayKey, sp.ev.id)
                      }}
                    >
                      ?
                    </button>
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

      {pastHorizon && (
        <p className={styles.horizon} role="status">
          thetezos.com events are loaded through{' '}
          {new Date(`${horizon}T00:00:00`).toLocaleDateString(undefined, {
            month: 'long',
            year: 'numeric',
          })}
          .{' '}
          <Button
            small
            secondary
            onClick={onExtendHorizon}
            disabled={extending}
          >
            {extending ? 'Loading…' : 'Load more'}
          </Button>
        </p>
      )}

      {/* Day popup — native <dialog> gives focus trap, Esc and backdrop. */}
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/click-events-have-key-events */}
      <dialog
        ref={dialogRef}
        className={styles.dialog}
        onClick={onDialogClick}
        onClose={() => {
          setSelected(null)
          setFocusId(null)
        }}
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
            <div
              key={event.id}
              data-event-id={event.id}
              className={event.id === focusId ? styles.dialog_focus : ''}
            >
              <CalendarEventCard
                event={event}
                roles={roles}
                truncateDescription
                linkToEvent
                onEdit={(ev) => {
                  closeDialog()
                  onEdit?.(ev)
                }}
                onHide={(ev) => {
                  closeDialog()
                  onHide?.(ev)
                }}
                onProposeEdit={(ev) => {
                  closeDialog()
                  onProposeEdit?.(ev)
                }}
              />
            </div>
          ))
        )}
      </dialog>
    </div>
  )
}
