import { Button } from '@atoms/button'
import ImageCarousel from './ImageCarousel'
import styles from '@style'

/** Format a stored datetime-local / ISO string for display. */
function formatDate(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

/**
 * A single calendar event. Edit/Delete actions are only rendered when `canEdit`
 * is true (the wallet-owner gate is decided by the parent page).
 *
 * @param {{
 *   event: import('@data/calendar/schema').CalendarEvent,
 *   canEdit?: boolean,
 *   onEdit?: (event: any) => void,
 *   onDelete?: (id: string) => void,
 * }} props
 */
export default function CalendarEventCard({
  event,
  canEdit,
  onEdit,
  onDelete,
}) {
  const { title, description, startDate, endDate, location, links, images } =
    event

  return (
    <article className={styles.card}>
      <header className={styles.card_header}>
        <div>
          <h2 className={styles.card_title}>{title || 'Untitled event'}</h2>
          <p className={styles.card_when}>
            {formatDate(startDate)}
            {endDate ? ` — ${formatDate(endDate)}` : ''}
          </p>
          {location && <p className={styles.card_where}>{location}</p>}
        </div>

        {canEdit && (
          <div className={styles.card_actions}>
            {/* WP-sourced events are read-only: they can be dismissed from
                state but not edited or written back. */}
            {!event.readOnly && (
              <Button small secondary onClick={() => onEdit?.(event)}>
                Edit
              </Button>
            )}
            <Button small secondary onClick={() => onDelete?.(event)}>
              {event.readOnly ? 'Dismiss' : 'Delete'}
            </Button>
          </div>
        )}
      </header>

      <ImageCarousel images={images} />

      {description && <p className={styles.card_description}>{description}</p>}

      {links?.length > 0 && (
        <ul className={styles.card_links}>
          {links.map((link, i) => (
            <li key={i}>
              <a href={link.url} target="_blank" rel="noopener noreferrer">
                {link.label || link.url}
              </a>
            </li>
          ))}
        </ul>
      )}
    </article>
  )
}
