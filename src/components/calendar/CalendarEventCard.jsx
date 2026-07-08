import { Button } from '@atoms/button'
import { downloadEventICS } from '@utils/calendarDownload'
import { recurrenceLabel } from '@data/calendar-chain'
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
 * A single calendar event card. Action buttons depend on the event source and
 * the viewer's roles:
 *  - on-chain events: moderators get Edit + Hide/Unhide; TEIA holders (non
 *    moderators) get "Propose edit".
 *  - read-only (WordPress) events: Dismiss (session only).
 * "Add to calendar" (one-off .ics download) is always available.
 *
 * @param {{
 *   event: any,
 *   roles?: { canModerate?: boolean, canPropose?: boolean },
 *   onEdit?: (event: any) => void,
 *   onHide?: (event: any) => void,
 *   onProposeEdit?: (event: any) => void,
 *   onDismiss?: (event: any) => void,
 * }} props
 */
export default function CalendarEventCard({
  event,
  roles,
  onEdit,
  onHide,
  onProposeEdit,
  onDismiss,
}) {
  const { title, description, startDate, endDate, location, links, images } =
    event
  // Event data can come from untrusted sources (community IPFS docs): never
  // render a non-http(s)/mailto href (javascript: URLs execute on click).
  const safeLinks = (links || []).filter((link) =>
    /^(https?:|mailto:)/i.test(String(link?.url || '').trim())
  )
  const isChain = event.source === 'chain'
  const canModerate = Boolean(roles?.canModerate)
  const canPropose = Boolean(roles?.canPropose)

  return (
    <article className={styles.card}>
      <header className={styles.card_header}>
        <div>
          <h2 className={styles.card_title}>
            {title || 'Untitled event'}
            {isChain && event.hidden ? ' (hidden)' : ''}
          </h2>
          <p className={styles.card_when}>
            {formatDate(startDate)}
            {endDate ? ` — ${formatDate(endDate)}` : ''}
          </p>
          {event.recurrence && (
            <p className={styles.card_where}>
              {recurrenceLabel(event.recurrence)}
            </p>
          )}
          {location && <p className={styles.card_where}>{location}</p>}
        </div>

        <div className={styles.card_actions}>
          <Button small secondary onClick={() => downloadEventICS(event)}>
            Add to calendar
          </Button>
          {isChain && canModerate && (
            <>
              <Button shadow_box fit onClick={() => onEdit?.(event)}>
                Edit
              </Button>
              <Button small secondary onClick={() => onHide?.(event)}>
                {event.hidden ? 'Unhide' : 'Hide'}
              </Button>
            </>
          )}
          {isChain && !canModerate && canPropose && (
            <Button shadow_box fit onClick={() => onProposeEdit?.(event)}>
              Propose edit
            </Button>
          )}
          {!isChain && event.readOnly && (
            <Button small secondary onClick={() => onDismiss?.(event)}>
              Dismiss
            </Button>
          )}
        </div>
      </header>

      <ImageCarousel images={images} />

      {description && <p className={styles.card_description}>{description}</p>}

      {safeLinks.length > 0 && (
        <ul className={styles.card_links}>
          {safeLinks.map((link, i) => (
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
