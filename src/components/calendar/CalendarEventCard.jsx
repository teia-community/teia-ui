import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@atoms/button'
import { Markdown } from '@components/markdown'
import { downloadEventICS } from '@utils/calendarDownload'
import { recurrenceLabel } from '@data/calendar-chain'
import { eventColorHex } from '@data/calendar-chain/colors'
import { PATH } from '@constants'
import ImageCarousel from './ImageCarousel'
import styles from '@style'

const ALL_DAY_RE = /^\d{4}-\d{2}-\d{2}$/

// Characters of the description shown in the compact card
const DESCRIPTION_PREVIEW = 280

/** Format a stored datetime-local / ISO string for display. */
function formatDate(value) {
  if (!value) return ''
  // All-day events are bare YYYY-MM-DD: parse as local midnight (not UTC) so
  // negative offsets don't shift the day back, and show a date only, no time.
  if (ALL_DAY_RE.test(value)) {
    const date = new Date(`${value}T00:00:00`)
    if (Number.isNaN(date.getTime())) return value
    return date.toLocaleDateString(undefined, { dateStyle: 'medium' })
  }
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
 *    moderators) get "Propose edit"; the event's own creator additionally gets
 *    Hide/Unhide for it — until a moderator hides it (mod_locked), after which
 *    only a moderator can unhide.
 * "Add to calendar" (one-off .ics download) is always available.
 *
 * @param {{
 *   event: any,
 *   roles?: { canModerate?: boolean, canPropose?: boolean },
 *   onEdit?: (event: any) => void,
 *   onHide?: (event: any) => void,
 *   onProposeEdit?: (event: any) => void,
 * }} props
 */
export default function CalendarEventCard({
  event,
  roles,
  onEdit,
  onHide,
  onProposeEdit,
  truncateDescription = false,
  linkToEvent = false,
}) {
  const {
    title,
    description,
    startDate,
    endDate,
    location,
    locations,
    tags,
    links,
    images,
    channels,
    collabs,
  } = event

  // In the compact card (day popup) a very long description is clamped to its
  // beginning with a "Read more" toggle.
  const [showFullDescription, setShowFullDescription] = useState(false)
  const isLongDescription =
    truncateDescription &&
    !!description &&
    description.length > DESCRIPTION_PREVIEW
  const shownDescription =
    isLongDescription && !showFullDescription
      ? `${description.slice(0, DESCRIPTION_PREVIEW).trimEnd()}…`
      : description
  // Event data can come from untrusted sources (community IPFS docs): never
  // render a non-http(s)/mailto href (javascript: URLs execute on click).
  const safeLinks = (links || []).filter((link) =>
    /^(https?:|mailto:)/i.test(String(link?.url || '').trim())
  )
  const isChain = event.source === 'chain'
  const canModerate = Boolean(roles?.canModerate)
  const canPropose = Boolean(roles?.canPropose)
  // The connected wallet created this event (approved from its own proposal),
  // so it may hide it and unhide it, unless a moderator has locked it.
  const isMine = Boolean(
    isChain &&
      event.creator &&
      roles?.address &&
      event.creator === roles.address
  )
  const canToggleHide = isMine && (!event.hidden || !event.modLocked)

  // Check on feed source
  const sourceKind = isChain ? 'teia' : event.source === 'wp' ? 'ttc' : null

  // Whole-calendar subscribe links, the same feed as the header "Subscribe"
  // dropdown — derived here so every card can offer them. Google Calendar has
  // no webcal handler (notably on Android), so it gets an add-by-URL link.
  const feedIcs =
    import.meta.env.VITE_CALENDAR_ICS_URL ||
    (typeof window !== 'undefined'
      ? `${window.location.origin}/calendar.ics`
      : '')
  const feedWebcal = feedIcs.replace(/^https?:\/\//, 'webcal://')
  const feedGoogle = feedIcs
    ? `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(
        feedIcs
      )}`
    : ''

  // Shareable teia.art URL for this event (chain series / WP occurrence).
  const detailPath = isChain
    ? event.slug
      ? `/calendar/event/${event.slug}`
      : `/calendar/event/chain-${event.eventId}`
    : event.source === 'wp' && event.slug
    ? `/calendar/event/${event.slug}`
    : ''
  const eventUrl =
    detailPath && typeof window !== 'undefined'
      ? `${window.location.origin}${detailPath}`
      : ''
  const [linkCopied, setLinkCopied] = useState(false)
  // update  the async Clipboard API
  const copyLink = async () => {
    if (!eventUrl) return
    try {
      await navigator.clipboard.writeText(eventUrl)
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 2000)
    } catch {
      // Clipboard unavailable (e.g. insecure context) — leave label unchanged.
    }
  }
  const accent = eventColorHex(event.color)

  return (
    <article
      className={styles.card}
      style={accent ? { borderLeft: `3px solid ${accent}` } : undefined}
    >
      <header className={styles.card_header}>
        <div>
          {sourceKind === 'teia' && (
            <span className={`${styles.source_tag} ${styles.source_tag_teia}`}>
              Teia
            </span>
          )}
          {sourceKind === 'ttc' && (
            <span className={`${styles.source_tag} ${styles.source_tag_ttc}`}>
              thetezos.com
            </span>
          )}
          <h2 className={styles.card_title}>
            {linkToEvent && detailPath ? (
              <Link to={detailPath} className={styles.card_title_link}>
                {title || 'Untitled event'}
              </Link>
            ) : (
              title || 'Untitled event'
            )}
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
          {locations?.length > 0 ? (
            <p className={styles.card_where}>{locations.join(' · ')}</p>
          ) : (
            location && <p className={styles.card_where}>{location}</p>
          )}
          {tags?.length > 0 && (
            <p className={styles.card_tags}>
              {tags.map((tag, i) => (
                <span key={i} className={styles.card_tag}>
                  {tag}
                </span>
              ))}
            </p>
          )}
          {(channels?.length > 0 || collabs?.length > 0) && (
            <div className={styles.card_related}>
              {(channels || []).map((ch) => (
                <Link
                  key={`ch-${ch.id}`}
                  to={`/inbox/channels/${ch.id}`}
                  className={styles.card_related_link}
                >
                  # {ch.name || `Channel #${ch.id}`}
                </Link>
              ))}
              {(collabs || []).map((co) => (
                <Link
                  key={`co-${co.address}`}
                  to={
                    co.name
                      ? `/collab/${co.name}`
                      : `${PATH.COLLAB}/${co.address}`
                  }
                  className={styles.card_related_link}
                >
                  ⚭ {co.name || co.address}
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className={styles.card_actions}>
          <Button shadow_box fit onClick={() => downloadEventICS(event)}>
            Add to calendar
          </Button>
          {eventUrl && (
            <Button shadow_box fit onClick={copyLink}>
              {linkCopied ? 'Link copied' : 'Copy link'}
            </Button>
          )}
          {isChain && feedWebcal && (
            <>
              <Button shadow_box fit href={feedGoogle}>
                Subscribe (Google Calendar)
              </Button>
              <Button shadow_box fit href={feedWebcal}>
                Subscribe (Apple / Outlook)
              </Button>
            </>
          )}
          {isChain && canModerate && (
            <>
              <Button shadow_box fit onClick={() => onEdit?.(event)}>
                Edit
              </Button>
              <Button shadow_box fit onClick={() => onHide?.(event)}>
                {event.hidden ? 'Unhide' : 'Hide'}
              </Button>
            </>
          )}
          {isChain && !canModerate && canPropose && (
            <Button shadow_box fit onClick={() => onProposeEdit?.(event)}>
              Propose edit
            </Button>
          )}
          {isChain && !canModerate && canToggleHide && (
            <Button shadow_box fit onClick={() => onHide?.(event)}>
              {event.hidden ? 'Unhide' : 'Hide'}
            </Button>
          )}
        </div>
      </header>

      <ImageCarousel images={images} />

      {description && (
        <div
          className={`${styles.card_description}${
            isChain ? '' : ` ${styles.card_description_plain}`
          }`}
        >
          {isChain ? <Markdown>{shownDescription}</Markdown> : shownDescription}
          {isLongDescription && (
            <button
              type="button"
              className={styles.card_description_toggle}
              onClick={() => setShowFullDescription((v) => !v)}
            >
              {showFullDescription ? 'Show less' : 'Read more'}
            </button>
          )}
        </div>
      )}

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
