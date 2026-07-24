// Read/write on-chain calendar event documents on IPFS (mirrors src/data/wiki/ipfs.ts).
//
// Event documents are pinned on the MSG IPFS proxy, the same as wiki pages.

import {
  fetchMsgIpfsJson,
  uploadMsgFileToIPFS,
  uploadMsgJsonToIPFS,
} from '@data/messaging/ipfs'
import { eventColorHex } from './colors'
import type {
  CalendarChannelRef,
  CalendarCollabRef,
  CalendarEventContent,
  CalendarLink,
  Recurrence,
} from './types'

export const CALENDAR_SCHEMA_VERSION = 1

// A CID is content-addressed — the same CID can never resolve to different
// content — so documents are cached for the session (the set of calendar
// events is small and bounded). Caching the promise means concurrent callers
// (feed load, detail page, edit-open) share one in-flight request; a failed
// fetch is evicted so a flaky gateway can be retried.
const docCache = new Map<string, Promise<CalendarEventContent>>()

/** Fetch and parse an event document from IPFS by its CID (session-cached). */
export function fetchEventContent(
  cid: string
): Promise<CalendarEventContent> {
  // Callers pass both `ipfs://<cid>` and bare CIDs; one cache entry for both.
  const key = cid.replace('ipfs://', '')
  const cached = docCache.get(key)
  if (cached) return cached
  const doc = fetchMsgIpfsJson<CalendarEventContent>(cid).catch((err) => {
    docCache.delete(key)
    throw err
  })
  docCache.set(key, doc)
  return doc
}

export interface EventDocInput {
  title: string
  startDate: string
  endDate?: string
  location?: string
  locations?: string[]
  description?: string
  links: CalendarLink[]
  /** ipfs:// URIs (uploaded via {@link uploadEventImage}). */
  images: string[]
  recurrence?: Recurrence
  color?: string
  tags?: string[]
  channels?: CalendarChannelRef[]
  collabs?: CalendarCollabRef[]
}

/** Build the IPFS event document (the content the CID points at). */
export function buildEventDocument(
  input: EventDocInput,
  author: string
): CalendarEventContent {
  return {
    schema_version: CALENDAR_SCHEMA_VERSION,
    title: input.title,
    startDate: input.startDate,
    ...(input.endDate ? { endDate: input.endDate } : {}),
    ...(input.locations?.length
      ? { locations: input.locations, location: input.locations.join(', ') }
      : {}),
    ...(input.description ? { description: input.description } : {}),
    links: input.links ?? [],
    images: input.images ?? [],
    ...(input.recurrence?.freq ? { recurrence: input.recurrence } : {}),
    ...(eventColorHex(input.color)
      ? { color: eventColorHex(input.color) }
      : {}),
    author,
    timestamp: new Date().toISOString(),
    ...(input.tags?.length ? { tags: input.tags } : {}),
    ...(input.channels?.length ? { channels: input.channels } : {}),
    ...(input.collabs?.length ? { collabs: input.collabs } : {}),
  }
}

/**
 * Upload an event document to IPFS and return its full `ipfs://<cid>` URI —
 * this is what gets written to the contract's cid field. The read path
 * (`fetchMsgIpfsJson`) strips the `ipfs://` prefix, so both forms resolve.
 */
export async function uploadEventContent(
  doc: CalendarEventContent
): Promise<string> {
  return uploadMsgJsonToIPFS(doc as unknown as Record<string, unknown>)
}

/** Upload a single image file to IPFS, returning its `ipfs://` URI. */
export async function uploadEventImage(file: File): Promise<string> {
  const cid = await uploadMsgFileToIPFS(file)
  return `ipfs://${cid}`
}
