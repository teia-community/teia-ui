// Read/write on-chain event documents on IPFS
// (mirrors src/data/calendar-chain/ipfs.ts).
//
// Event documents and screenshots are pinned on the MSG IPFS proxy, the same
// as wiki pages and calendar events.

import {
  fetchMsgIpfsJson,
  uploadMsgFileToIPFS,
  uploadMsgJsonToIPFS,
} from '@data/messaging/ipfs'
import type { EventContent } from './types'

export const EVENT_SCHEMA_VERSION = 1

// A CID is content-addressed, so documents are cached for the session.
// Caching the promise lets concurrent callers share one in-flight request; a
// failed fetch is evicted so a flaky gateway can be retried.
const docCache = new Map<string, Promise<EventContent>>()

/** Fetch and parse an event document from IPFS by its CID (session-cached). */
export function fetchEventContent(cid: string): Promise<EventContent> {
  const key = cid.replace('ipfs://', '')
  const cached = docCache.get(key)
  if (cached) return cached
  const doc = fetchMsgIpfsJson<EventContent>(cid).catch((err) => {
    docCache.delete(key)
    throw err
  })
  docCache.set(key, doc)
  return doc
}

export interface EventDocInput {
  title: string
  subtitle?: string
  description?: string
  link: string
  /** ipfs:// URI (see {@link uploadEventScreenshot}) or a plain URL. */
  screenshot?: string
  bannerColor?: string
}

/** Build the IPFS event document (the content the CID points at). */
export function buildEventDocument(
  input: EventDocInput,
  author: string
): EventContent {
  return {
    schema_version: EVENT_SCHEMA_VERSION,
    title: input.title,
    ...(input.subtitle ? { subtitle: input.subtitle } : {}),
    ...(input.description ? { description: input.description } : {}),
    link: input.link,
    ...(input.screenshot ? { screenshot: input.screenshot } : {}),
    ...(input.bannerColor ? { bannerColor: input.bannerColor } : {}),
    author,
    timestamp: new Date().toISOString(),
  }
}

/**
 * Upload an event document to IPFS and return its full `ipfs://<cid>` URI —
 * this is what gets written to the contract's cid field.
 */
export async function uploadEventContent(doc: EventContent): Promise<string> {
  return uploadMsgJsonToIPFS(doc as unknown as Record<string, unknown>)
}

/** Upload a screenshot image to IPFS, returning its `ipfs://` URI. */
export async function uploadEventScreenshot(file: File): Promise<string> {
  const cid = await uploadMsgFileToIPFS(file)
  return `ipfs://${cid}`
}
