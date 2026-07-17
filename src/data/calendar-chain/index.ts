// On-chain calendar source — read path.
//
// Reads the teiaCalendar contract's `events` bigmap via TzKT, fetches each
// event's IPFS document, and maps it onto the shared CalendarEvent shape so the
// existing calendar UI renders on-chain events alongside local + WordPress ones
// (merged in src/hooks/use-calendar.js). Read-only until the write slice lands.

import { msgIpfsToUrl } from '@data/messaging/ipfs'
import { fetchChainEvent, fetchEvents } from './api'
import { eventColorHex } from './colors'
import { fetchEventContent } from './ipfs'
import { expandOccurrences } from './recurrence.mjs'
import type {
  CalendarChannelRef,
  CalendarCollabRef,
  CalendarEventContent,
  CalendarFeedEvent,
  ChainEvent,
} from './types'

export * from './types'
export { fetchEvents, fetchProposals } from './api'
export * from './ipfs'
export * from './actions'
export * from './hooks'
export { showGetTeiaModal } from './proposeGate'
export { occurrenceAt, expandOccurrences, recurrenceLabel } from './recurrence.mjs'

/** Resolve an image reference (ipfs:// URI or plain URL) to a display URL. */
function imageUrl(ref: string): string {
  return String(ref).startsWith('ipfs://') ? msgIpfsToUrl(ref) : ref
}

/**
 * Links come from community-controlled IPFS JSON and are rendered as hrefs:
 * keep only http(s)/mailto URLs (drops javascript: and other active schemes).
 */
function safeLinks(links: unknown): { label?: string; url: string }[] {
  if (!Array.isArray(links)) return []
  return links
    .filter((l) => l && typeof l.url === 'string')
    .map((l) => ({ ...l, url: l.url.trim() }))
    .filter((l) => /^(https?:|mailto:)/i.test(l.url))
}

/**
 * Channel/collab links come from community-controlled IPFS JSON: keep only
 * well-formed refs (string id / KT1 address) so a malformed doc can't break the
 * feed or point a link somewhere unexpected.
 */
function safeChannels(v: unknown): CalendarChannelRef[] {
  if (!Array.isArray(v)) return []
  return v
    .filter((c) => c && typeof c.id === 'string')
    .map((c) => ({
      id: String(c.id),
      name: typeof c.name === 'string' ? c.name : '',
    }))
}
function safeCollabs(v: unknown): CalendarCollabRef[] {
  if (!Array.isArray(v)) return []
  return v
    .filter(
      (c) => c && typeof c.address === 'string' && /^KT1[0-9A-Za-z]+$/.test(c.address)
    )
    .map((c) => ({
      address: String(c.address),
      name: typeof c.name === 'string' ? c.name : '',
    }))
}

/**
 * The color comes from community-controlled IPFS JSON: keep it only when
 * it's a strict `#rrggbb` hex or a known EVENT_COLORS token (earlier docs),
 * so an invalid/hostile value never reaches the renderer's inline style.
 */
const safeColor = (raw: unknown): string | undefined =>
  typeof raw === 'string' && eventColorHex(raw) ? raw : undefined

/**
 * In-app occurrence window: ~6 months back to ~18 months ahead of today.
 * Recurring events are expanded within this; the .ics feed carries the full
 * series via RRULE so calendar apps expand it without bound.
 */
function expansionWindow() {
  const p = (n: number) => String(n).padStart(2, '0')
  const fmt = (d: Date) => `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
  const now = new Date()
  const start = new Date(now)
  start.setMonth(start.getMonth() - 6)
  const end = new Date(now)
  end.setMonth(end.getMonth() + 18)
  return { windowStart: fmt(start), windowEnd: fmt(end) }
}

/**
 * Map a raw IPFS event document onto the shape CalendarEventCard renders, so
 * the moderator queue can show a proposal's full content (with the same link/
 * image sanitizing as the live feed) before approving it.
 */
export function docToDisplayEvent(
  doc: CalendarEventContent,
  id: string
): Partial<CalendarFeedEvent> & { id: string } {
  const locations = doc.locations?.length
    ? doc.locations
    : doc.location
    ? [doc.location]
    : []
  return {
    id,
    title: doc.title || '',
    description: doc.description || '',
    location: locations.join(', '),
    locations,
    startDate: doc.startDate || '',
    endDate: doc.endDate || '',
    links: safeLinks(doc.links) as CalendarFeedEvent['links'],
    images: Array.isArray(doc.images) ? doc.images.map(imageUrl) : [],
    recurrence: doc.recurrence,
    color: safeColor(doc.color),
    tags: doc.tags ?? [],
    channels: safeChannels(doc.channels),
    collabs: safeCollabs(doc.collabs),
  }
}

/**
 * Shared display fields for a chain event. Everything except id/startDate/
 * endDate, which differ between the series entry and its expanded occurrences.
 */
function baseFeedEvent(e: ChainEvent, c: CalendarEventContent) {
  const locations = c.locations?.length
    ? c.locations
    : c.location
    ? [c.location]
    : []
  return {
    eventId: e.id,
    cid: e.cid,
    hidden: e.hidden,
    creator: e.creator || '',
    modLocked: e.modLocked,
    title: c.title || '',
    description: c.description || '',
    location: locations.join(', '),
    locations,
    links: safeLinks(c.links) as CalendarFeedEvent['links'],
    images: Array.isArray(c.images) ? c.images.map(imageUrl) : [],
    color: safeColor(c.color),
    tags: c.tags ?? [],
    channels: safeChannels(c.channels),
    collabs: safeCollabs(c.collabs),
    createdBy: c.author || '',
    createdAt: e.createdAt || '',
    updatedAt: e.updatedAt || '',
    source: 'chain' as const,
    recurrence: c.recurrence,
    seriesStart: c.startDate || '',
    seriesEnd: c.endDate || '',
  }
}

/**
 * Fetch a single on-chain event as a series-level display entry (id
 * `chain-<n>`), for the dedicated event URL.
 * Return to be adjusted
 */
export async function fetchChainEventById(
  eventId: number | string,
  {
    includeHidden = false,
    viewerAddress,
  }: { includeHidden?: boolean; viewerAddress?: string } = {}
): Promise<CalendarFeedEvent | null> {
  const idNum = Number(eventId)
  if (!Number.isFinite(idNum)) return null
  const e = await fetchChainEvent(idNum)
  if (!e) return null
  const visible =
    includeHidden ||
    !e.hidden ||
    (!e.modLocked && !!viewerAddress && e.creator === viewerAddress)
  if (!visible) return null
  let c: CalendarEventContent
  try {
    c = await fetchEventContent(e.cid)
  } catch {
    return null
  }
  return {
    ...baseFeedEvent(e, c),
    id: `chain-${e.id}`,
    startDate: c.startDate || '',
    endDate: c.endDate || '',
  } as CalendarFeedEvent
}

/**
 * Fetch on-chain events, mapped onto the calendar UI shape. Recurring events are
 * expanded into one entry per occurrence (id `chain-<n>::<iso>`), all sharing
 * the same eventId/cid so edit/hide act on the whole series. An event whose IPFS
 * document fails to load is skipped rather than breaking the feed.
 *
 * Hidden events are filtered out, except: moderators see all of them
 * (`includeHidden`), and a creator still sees their own event when they hid it
 * themselves (not `mod_locked`) so they can unhide it. A moderator-hidden event
 * disappears for the creator too, matching the on-chain rule that only a
 * moderator can unhide it.
 */
export async function fetchChainCalendarEvents({
  includeHidden = false,
  viewerAddress,
}: {
  includeHidden?: boolean
  viewerAddress?: string
} = {}): Promise<CalendarFeedEvent[]> {
  const events = (await fetchEvents()).filter(
    (e) =>
      includeHidden ||
      !e.hidden ||
      (!e.modLocked && !!viewerAddress && e.creator === viewerAddress)
  )
  const docs = await Promise.allSettled(
    events.map((e) => fetchEventContent(e.cid))
  )
  const window = expansionWindow()

  const out: CalendarFeedEvent[] = []
  events.forEach((e, i) => {
    const r = docs[i]
    if (r.status !== 'fulfilled') return
    const c = r.value
    const base = baseFeedEvent(e, c)

    if (c.recurrence?.freq) {
      for (const occ of expandOccurrences(
        c.startDate || '',
        c.endDate || '',
        c.recurrence,
        window
      )) {
        out.push({
          ...base,
          id: `chain-${e.id}::${occ.startDate}`,
          startDate: occ.startDate,
          endDate: occ.endDate,
        })
      }
    } else {
      out.push({
        ...base,
        id: `chain-${e.id}`,
        startDate: c.startDate || '',
        endDate: c.endDate || '',
      })
    }
  })
  return out
}
