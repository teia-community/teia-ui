// Read/write Wiki
//
// Pages are stored on the MSG_IPFS_PROXY. We need to add ipfs:// to the CID on the contract

import { fetchMsgIpfsJson, uploadMsgJsonToIPFS } from '@data/messaging/ipfs'
import type { WikiPageContent } from './types'

export const WIKI_SCHEMA_VERSION = 1

/** Fetch and parse a page document from IPFS by its CID. */
export async function fetchPageContent(cid: string): Promise<WikiPageContent> {
  return fetchMsgIpfsJson<WikiPageContent>(cid)
}

/**
 * Build a page document. `parent` is the teia-ui-only hierarchy field
 * (the contract is unaware of it).
 */
export function buildPageDocument({
  title,
  slug,
  parent,
  content,
  author,
  summary,
}: {
  title: string
  slug: string
  parent: string | null
  content: string
  author: string
  summary?: string
}): WikiPageContent {
  return {
    schema_version: WIKI_SCHEMA_VERSION,
    title,
    slug,
    parent: parent || null,
    content,
    format: 'markdown',
    author,
    timestamp: new Date().toISOString(),
    ...(summary ? { summary } : {}),
  }
}

/**
 * Upload a page document to IPFS and return the bare CID (no `ipfs://`),
 * ready to be passed straight to the contract's cid parameter.
 */
export async function uploadPageContent(doc: WikiPageContent): Promise<string> {
  const uri = await uploadMsgJsonToIPFS(doc as unknown as Record<string, unknown>)
  return uri.replace('ipfs://', '')
}
