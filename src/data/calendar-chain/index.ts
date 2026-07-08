// On-chain calendar source — read path.
//
// Reads the teiaCalendar contract's `events` bigmap via TzKT, fetches each
// event's IPFS document, and maps it onto the shared CalendarEvent shape so the
// existing calendar UI renders on-chain events alongside local + WordPress ones
// (merged in src/hooks/use-calendar.js). Read-only until the write slice lands.

import { msgIpfsToUrl } from '@data/messaging/ipfs'
import { fetchEvents } from './api'
import { fetchEventContent } from './ipfs'
import { expandOccurrences } from './recurrence.mjs'
import type { CalendarFeedEvent } from './types'

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
 * Fetch on-chain events, mapped onto the calendar UI shape. Recurring events are
 * expanded into one entry per occurrence (id `chain-<n>::<iso>`), all sharing
 * the same eventId/cid so edit/hide act on the whole series. Hidden events are
 * filtered unless `includeHidden` (moderators); an event whose IPFS document
 * fails to load is skipped rather than breaking the feed.
 */
export async function fetchChainCalendarEvents({
  includeHidden = false,
}: { includeHidden?: boolean } = {}): Promise<CalendarFeedEvent[]> {
  const events = (await fetchEvents()).filter(
    (e) => includeHidden || !e.hidden
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
    const base = {
      eventId: e.id,
      cid: e.cid,
      hidden: e.hidden,
      title: c.title || '',
      description: c.description || '',
      location: c.location || '',
      links: safeLinks(c.links),
      images: Array.isArray(c.images) ? c.images.map(imageUrl) : [],
      createdBy: c.author || '',
      createdAt: e.createdAt || '',
      updatedAt: e.updatedAt || '',
      source: 'chain' as const,
      recurrence: c.recurrence,
      seriesStart: c.startDate || '',
      seriesEnd: c.endDate || '',
    }

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
