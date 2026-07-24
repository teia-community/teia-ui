import { useMemo } from 'react'
import { localDayKey, toInstant } from '@utils/datetime'
import CalendarEventCard from './CalendarEventCard'
import styles from '@style'

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

/**
 * Group past events (before the current month) into year → month buckets,
 * each sorted most-recent-first, for the nested accordion below.
 */
function groupByYearMonth(events) {
  const byYear = new Map()
  for (const ev of events) {
    const date = localDayKey(ev.startDate)
    if (!date) continue
    const year = date.slice(0, 4)
    const month = Number(date.slice(5, 7)) - 1 // 0-indexed
    if (!byYear.has(year)) byYear.set(year, new Map())
    const byMonth = byYear.get(year)
    if (!byMonth.has(month)) byMonth.set(month, [])
    byMonth.get(month).push(ev)
  }
  // Years desc; months desc; events within a month desc by start date.
  return [...byYear.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([year, byMonth]) => [
      year,
      [...byMonth.entries()]
        .sort((a, b) => b[0] - a[0])
        .map(([month, evs]) => [
          month,
          evs.sort((a, b) => toInstant(b.startDate) - toInstant(a.startDate)),
        ]),
    ])
}

/**
 * "Show Previous Events" accordion: collapsed by default, with a sub-accordion
 * per year and, inside each, a sub-accordion per month. Reuses
 * {@link CalendarEventCard} so admin edit/delete works here too.
 *
 * @param {{
 *   events: import('@data/calendar/schema').CalendarEvent[],
 *   roles?: { canModerate?: boolean, canPropose?: boolean },
 *   onEdit?: (event: any) => void,
 *   onHide?: (event: any) => void,
 *   onProposeEdit?: (event: any) => void,
 * }} props
 */
export default function PreviousEvents({
  events,
  roles,
  onEdit,
  onHide,
  onProposeEdit,
}) {
  const grouped = useMemo(() => groupByYearMonth(events), [events])

  if (events.length === 0) return null

  return (
    <details className={styles.prev}>
      <summary className={styles.prev_summary}>
        Show Previous Events ({events.length})
      </summary>
      <div className={styles.prev_body}>
        {grouped.map(([year, months]) => (
          <details key={year} className={styles.prev_year}>
            <summary className={styles.prev_summary}>{year}</summary>
            <div className={styles.prev_body}>
              {months.map(([month, evs]) => (
                <details key={month} className={styles.prev_month}>
                  <summary className={styles.prev_summary}>
                    {MONTHS[month]} ({evs.length})
                  </summary>
                  <div className={styles.prev_body}>
                    {evs.map((event) => (
                      <CalendarEventCard
                        key={event.id}
                        event={event}
                        roles={roles}
                        onEdit={onEdit}
                        onHide={onHide}
                        onProposeEdit={onProposeEdit}
                      />
                    ))}
                  </div>
                </details>
              ))}
            </div>
          </details>
        ))}
      </div>
    </details>
  )
}
