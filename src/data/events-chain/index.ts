// On-chain events registry — the source for the /events page and the header
// events dropdown.
//
// Reads the teiaEvents contract's `events` bigmap via TzKT, fetches each
// event's IPFS document, and maps it onto the shape the events UI already
// renders (see src/data/events/api.js), so swapping the mocked feed for this
// one needs no UI changes.

import { msgIpfsToUrl } from '@data/messaging/ipfs'
import { fetchEventRecord, fetchEventRecords } from './api'
import { fetchEventContent } from './ipfs'
import type { ChainEventRecord, EventContent, ShowcaseEvent } from './types'

export * from './types'
export { fetchEventRecords, fetchEventRecord, fetchEventProposals } from './api'
export * from './ipfs'
export * from './actions'
export * from './hooks'

const DEFAULT_BANNER_COLOR = '#f0f0f0'

/**
 * The link comes from community-submitted IPFS JSON and is used as an href
 * and an iframe src: keep only http(s) URLs (drops javascript: and other
 * active schemes).
 */
function safeLink(link: unknown): string {
  try {
    const url = new URL(String(link))
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : ''
  } catch {
    return ''
  }
}

/** Resolve a screenshot reference to a display URL (empty if unusable). */
function screenshotUrl(ref: unknown): string {
  const value = String(ref ?? '')
  if (value.startsWith('ipfs://')) return msgIpfsToUrl(value)
  // Site-relative paths (the bundled /events/*.png screenshots).
  if (/^\/[^/]/.test(value)) return value
  return safeLink(value)
}

function toShowcaseEvent(
  record: ChainEventRecord,
  doc: EventContent
): ShowcaseEvent | null {
  const link = safeLink(doc?.link)
  // A card with no title or nowhere to go is not displayable.
  if (!doc?.title || !link) return null
  return {
    id: String(record.id),
    eventId: record.id,
    cid: record.cid,
    hidden: record.hidden,
    proposer: record.proposer,
    title: String(doc.title),
    subtitle: String(doc.subtitle ?? ''),
    description: String(doc.description ?? ''),
    link,
    screenshot: screenshotUrl(doc.screenshot),
    bannerColor: /^#[0-9a-f]{6}$/i.test(String(doc.bannerColor))
      ? String(doc.bannerColor)
      : DEFAULT_BANNER_COLOR,
  }
}

/**
 * All on-chain events with their documents resolved. An event whose document
 * cannot be fetched or is not displayable is skipped, so one bad CID never
 * blanks the page.
 */
export async function fetchShowcaseEvents({
  includeHidden = false,
}: { includeHidden?: boolean } = {}): Promise<ShowcaseEvent[]> {
  const records = await fetchEventRecords(includeHidden)
  const docs = await Promise.allSettled(
    records.map((r) => fetchEventContent(r.cid))
  )
  return records.flatMap((record, i) => {
    const r = docs[i]
    const event =
      r.status === 'fulfilled' ? toShowcaseEvent(record, r.value) : null
    return event ? [event] : []
  })
}

/** A single on-chain event by id, or null if missing / not displayable. */
export async function fetchShowcaseEvent(
  id: number
): Promise<ShowcaseEvent | null> {
  const record = await fetchEventRecord(id)
  if (!record) return null
  return toShowcaseEvent(record, await fetchEventContent(record.cid))
}
