// Read/write curation documents.
//
// Documents are stored on the MSG_IPFS_PROXY. We store the bare CID on the
// contract and add `ipfs://` back only for display/fetch.
//
// WIll be consolidated soon.

import { fetchMsgIpfsJson, uploadMsgJsonToIPFS } from '@data/messaging/ipfs'
import type {
  CurationContent,
  CurationFeeConfig,
  CurationLayout,
  CurationToken,
} from './types'

export const CURATION_SCHEMA_VERSION = 1

/** Fetch and parse a curation document from IPFS by its CID. */
export async function fetchCurationContent(
  cid: string
): Promise<CurationContent> {
  return fetchMsgIpfsJson<CurationContent>(cid)
}

/** Build a curation document ready to be pinned to IPFS. */
export function buildCurationDocument({
  title,
  description,
  coverImage,
  layout,
  tokens,
  fee,
  owner,
  editor,
}: {
  title: string
  description: string
  coverImage?: string
  layout: CurationLayout
  tokens: CurationToken[]
  fee: CurationFeeConfig
  owner: string
  editor: string
}): CurationContent {
  return {
    schema_version: CURATION_SCHEMA_VERSION,
    title,
    description,
    ...(coverImage ? { cover_image: coverImage } : {}),
    display: { layout },
    tokens,
    curations: [],
    fee,
    owner,
    editor,
    timestamp: new Date().toISOString(),
  }
}

export async function uploadCurationContent(
  doc: CurationContent
): Promise<string> {
  const uri = await uploadMsgJsonToIPFS(
    doc as unknown as Record<string, unknown>
  )
  return uri.replace('ipfs://', '')
}
