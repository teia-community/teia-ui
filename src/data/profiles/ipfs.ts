// Read/write on-chain profile documents on IPFS.
//
// Profile documents and avatars are pinned on the MSG IPFS proxy, the same as
// wiki pages, calendar events and curations.

import {
  fetchMsgIpfsJson,
  uploadMsgFileToIPFS,
  uploadMsgJsonToIPFS,
} from '@data/messaging/ipfs'
import type { ProfileCard, ProfileContent } from './types'

export const PROFILE_SCHEMA_VERSION = 1

// A CID is content-addressed, so documents are cached for the session.
// Caching the promise lets concurrent callers share one in-flight request; a
// failed fetch is evicted so a flaky gateway can be retried.
const docCache = new Map<string, Promise<ProfileContent>>()

/** Fetch and parse a profile document from IPFS by its CID (session-cached). */
export function fetchProfileContent(cid: string): Promise<ProfileContent> {
  const key = cid.replace('ipfs://', '')
  const cached = docCache.get(key)
  if (cached) return cached
  const doc = fetchMsgIpfsJson<ProfileContent>(cid).catch((err) => {
    docCache.delete(key)
    throw err
  })
  docCache.set(key, doc)
  return doc
}

export interface ProfileDocInput {
  name?: string
  description?: string
  /** ipfs:// URI (see {@link uploadProfileAvatar}). */
  identicon?: string
  card?: ProfileCard
}

/** Build the IPFS profile document (the content the CID points at). */
export function buildProfileDocument(input: ProfileDocInput): ProfileContent {
  return {
    schema_version: PROFILE_SCHEMA_VERSION,
    ...(input.name ? { name: input.name } : {}),
    ...(input.description ? { description: input.description } : {}),
    ...(input.identicon ? { identicon: input.identicon } : {}),
    ...(input.card
      ? { card: { show: input.card.show ?? [], tags: input.card.tags ?? [] } }
      : {}),
    timestamp: new Date().toISOString(),
  }
}

/**
 * Upload a profile document to IPFS and return its full `ipfs://<cid>` URI —
 * this is what gets written to the contract's cid field.
 */
export async function uploadProfileContent(
  doc: ProfileContent
): Promise<string> {
  return uploadMsgJsonToIPFS(doc as unknown as Record<string, unknown>)
}

/** Upload an avatar image to IPFS, returning its `ipfs://` URI. */
export async function uploadProfileAvatar(file: File): Promise<string> {
  const cid = await uploadMsgFileToIPFS(file)
  return `ipfs://${cid}`
}
