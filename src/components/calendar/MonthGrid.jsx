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

  const selectedEvents = (selected && byDay[selected]) || []
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
        {cells.map((day, i) => {
          if (day === null) {
            return <span key={`blank-${i}`} className={styles.day_blank} />
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
              disabled={!count}
              onClick={() => openDay(key)}
              aria-label={`${MONTHS[month]} ${day}, ${count} event${
                count === 1 ? '' : 's'
              }`}
            >
              <span className={styles.day_number}>{day}</span>
              {count > 0 && <span className={styles.day_count}>{count}</span>}
            </button>
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
