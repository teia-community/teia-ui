import { Link, useParams } from 'react-router-dom'
import { Page } from '@atoms/layout'
import { Loading } from '@atoms/loading'
import { useCalendarEvent } from '@hooks/use-calendar'
import CalendarEventCard from '@components/calendar/CalendarEventCard'
import styles from '@style'

/**
 * Dedicated, shareable page for a single calendar event (`/calendar/event/:id`).
 */
export default function CalendarEvent() {
  const { id } = useParams()
  const { event, isLoading, notFound } = useCalendarEvent(id)

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
          <CalendarEventCard event={event} />
        )}
      </div>
    </Page>
  )
}
