import { Link, Navigate, useParams } from 'react-router-dom'
import { Page } from '@atoms/layout'
import { Loading } from '@atoms/loading'
import { useCalendarEvent } from '@hooks/use-calendar'
import { isAllDay } from '@utils/datetime'
import CalendarEventCard from '@components/calendar/CalendarEventCard'
import styles from '@style'

// How many upcoming dates to list before collapsing the rest into a count.
// May go into constants?
const MAX_UPCOMING = 8

/** Human-readable date (all-day → date only, otherwise date + time). */
function formatOccurrence(value) {
  if (!value) return ''
  if (isAllDay(value)) {
    const date = new Date(`${value}T00:00:00`)
    if (Number.isNaN(date.getTime())) return value
    return date.toLocaleDateString(undefined, { dateStyle: 'full' })
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString(undefined, {
    dateStyle: 'full',
    timeStyle: 'short',
  })
}

/**
 * Dedicated, shareable page for a single calendar event (`/calendar/event/:id`).
 * TTC events resolve by their name (WP slug); a recurring series has one page
 * that features its current/next occurrence and lists the upcoming dates.
 */
export default function CalendarEvent() {
  const { id } = useParams()
  const { event, upcoming, isLoading, notFound } = useCalendarEvent(id)

  // Canonicalize chain-<id> / stale URLs to the event's name slug.
  if (event?.slug && id !== event.slug) {
    return <Navigate to={`/calendar/event/${event.slug}`} replace />
  }

  const shownUpcoming = upcoming.slice(0, MAX_UPCOMING)
  const extraUpcoming = upcoming.length - shownUpcoming.length

  return (
    <Page title={event?.title || 'Event'}>
      <div className={styles.container}>
        <Link to="/calendar" className={styles.back}>
          ‹ Back to calendar
        </Link>

        {isLoading && !event ? (
          <Loading message="Loading event" />
        ) : notFound || !event ? (
          <p className={styles.empty}>Event not found.</p>
        ) : (
          <>
            <CalendarEventCard event={event} />

            {upcoming.length > 0 && (
              <section className={styles.upcoming}>
                <h2 className={styles.upcoming_title}>Upcoming dates</h2>
                <ul className={styles.upcoming_list}>
                  {shownUpcoming.map((occ) => (
                    <li key={occ.id}>{formatOccurrence(occ.startDate)}</li>
                  ))}
                  {extraUpcoming > 0 && (
                    <li className={styles.upcoming_more}>
                      +{extraUpcoming} more
                    </li>
                  )}
                </ul>
              </section>
            )}
          </>
        )}
      </div>
    </Page>
  )
}
