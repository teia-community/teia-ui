import { useMemo, useState } from 'react'
import { Button } from '@atoms/button'
import { MONTHS, WEEKDAYS, eventsByDay, keyOf } from './MonthGrid'
import CalendarEventCard from './CalendarEventCard'
import styles from '@style'

const keyOfDate = (d) => keyOf(d.getFullYear(), d.getMonth(), d.getDate())

const addDays = (d, n) => {
  const next = new Date(d)
  next.setDate(d.getDate() + n)
  return next
}

/**
 * Single-day view (mobile opt-in): a week strip to pick the day, then that
 * day's events as CalendarEventCards. Arrows step the month; mini week
 * buttons pick the week.
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
export default function DayView({
  events,
  roles,
  onEdit,
  onHide,
  onProposeEdit,
  horizon,
  extending,
  onExtendHorizon,
}) {
  const [selected, setSelected] = useState(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  })

  const byDay = useMemo(() => eventsByDay(events), [events])

  const todayKey = keyOfDate(new Date())
  const selectedKey = keyOfDate(selected)
  const weekStart = addDays(selected, -selected.getDay())
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  // Month shown is the selected day's; its weeks back the mini week buttons.
  const year = selected.getFullYear()
  const month = selected.getMonth()
  const monthStart = new Date(year, month, 1)
  const monthEnd = new Date(year, month + 1, 0)
  const weeks = []
  for (
    let w = addDays(monthStart, -monthStart.getDay());
    w <= monthEnd;
    w = addDays(w, 7)
  ) {
    // Clamp to the month so a week's label and target stay in this month.
    const first = w < monthStart ? monthStart : w
    const end = addDays(w, 6)
    const last = end > monthEnd ? monthEnd : end
    weeks.push({ key: keyOfDate(w), first, last })
  }
  const weekKey = keyOfDate(weekStart)

  // Month arrows land on the 1st, or today when stepping into this month.
  const stepMonth = (delta) => {
    const d = new Date(year, month + delta, 1)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const isThisMonth =
      d.getFullYear() === today.getFullYear() &&
      d.getMonth() === today.getMonth()
    setSelected(isThisMonth ? today : d)
  }

  // Teia events first
  const dayEvents = [...(byDay[selectedKey] || [])].sort(
    (a, b) =>
      Number(b.source === 'chain' || !!b.teia_event) -
      Number(a.source === 'chain' || !!a.teia_event)
  )

  const pastHorizon = Boolean(horizon) && selectedKey > horizon

  return (
    <div className={styles.dayview}>
      <div className={styles.month_nav} data-tour="day-month">
        <Button
          small
          secondary
          alt="Previous month"
          onClick={() => stepMonth(-1)}
        >
          ‹
        </Button>
        <span className={styles.month_title} aria-live="polite">
          {MONTHS[month]} {year}
        </span>
        <Button small secondary alt="Next month" onClick={() => stepMonth(1)}>
          ›
        </Button>
      </div>

      <div
        className={styles.week_picks}
        role="group"
        aria-label="Pick a week"
        data-tour="day-weeks"
      >
        {weeks.map(({ key, first, last }) => (
          <button
            key={key}
            type="button"
            className={`${styles.week_pick} ${
              key === weekKey ? styles.week_pick_selected : ''
            }`}
            aria-pressed={key === weekKey}
            aria-label={`Week of ${MONTHS[month]} ${first.getDate()}`}
            onClick={() => setSelected(first)}
          >
            {first.getDate()}–{last.getDate()}
          </button>
        ))}
      </div>

      <div
        className={styles.week_strip}
        role="group"
        aria-label="Pick a day"
        data-tour="day-strip"
      >
        {days.map((d) => {
          const key = keyOfDate(d)
          const count = byDay[key]?.length || 0
          return (
            <button
              key={key}
              type="button"
              className={[
                styles.week_day,
                key === selectedKey ? styles.week_day_selected : '',
                key === todayKey ? styles.week_day_today : '',
              ].join(' ')}
              aria-pressed={key === selectedKey}
              aria-label={`${
                MONTHS[d.getMonth()]
              } ${d.getDate()}, ${count} event${count === 1 ? '' : 's'}`}
              onClick={() => setSelected(d)}
            >
              <span className={styles.week_day_name}>
                {WEEKDAYS[d.getDay()]}
              </span>
              <span className={styles.day_number}>{d.getDate()}</span>
              <span className={styles.week_day_count} aria-hidden="true">
                {count || ''}
              </span>
            </button>
          )
        })}
      </div>

      <h2 className={styles.day_title}>
        {selected.toLocaleDateString(undefined, { dateStyle: 'full' })}
      </h2>

      {dayEvents.length === 0 ? (
        <p className={styles.empty}>No events this day.</p>
      ) : (
        dayEvents.map((event) => (
          <CalendarEventCard
            key={event.id}
            event={event}
            roles={roles}
            truncateDescription
            linkToEvent
            onEdit={onEdit}
            onHide={onHide}
            onProposeEdit={onProposeEdit}
          />
        ))
      )}

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
    </div>
  )
}
