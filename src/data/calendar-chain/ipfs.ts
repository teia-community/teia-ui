// Read/write on-chain calendar event documents on IPFS (mirrors src/data/wiki/ipfs.ts).
//
// Event documents are pinned on the MSG IPFS proxy, the same as wiki pages.

import {
  fetchMsgIpfsJson,
  uploadMsgFileToIPFS,
  uploadMsgJsonToIPFS,
} from '@data/messaging/ipfs'
import type { CalendarEventContent, CalendarLink, Recurrence } from './types'

export const CALENDAR_SCHEMA_VERSION = 1

/** Fetch and parse an event document from IPFS by its CID. */
export async function fetchEventContent(
  cid: string
): Promise<CalendarEventContent> {
  return fetchMsgIpfsJson<CalendarEventContent>(cid)
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
  tags?: string[]
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
    author,
    timestamp: new Date().toISOString(),
    ...(input.tags?.length ? { tags: input.tags } : {}),
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
