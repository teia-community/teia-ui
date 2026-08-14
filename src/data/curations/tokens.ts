// Resolve a curation's token references (fa2 + token_id) to full token data

import useSWR from 'swr'
import { request, gql } from 'graphql-request'
import { BaseTokenFieldsFragment } from '@data/api'
import type { CurationToken } from './types'

const TOKENS_BY_REF = gql`
  ${BaseTokenFieldsFragment}
  query CurationTokens($conds: [tokens_bool_exp!]) {
    tokens(where: { _or: $conds }) {
      ...baseTokenFields
    }
  }
`

/** Fetch every token referenced by a curation, ordered as in `refs`. */
export async function fetchCurationTokens(
  refs: CurationToken[]
): Promise<any[]> {
  if (!refs.length) return []

  const conds = refs.map((r) => ({
    _and: [
      { fa2_address: { _eq: r.fa2_address } },
      { token_id: { _eq: r.token_id } },
    ],
  }))

  const data = await request(
    import.meta.env.VITE_TEIA_GRAPHQL_API,
    TOKENS_BY_REF,
    { conds }
  )

  // Index by `${fa2}:${token_id}` so we can re-emit in curator order.
  const byRef = new Map<string, any>()
  for (const token of data.tokens ?? []) {
    byRef.set(`${token.fa2_address}:${token.token_id}`, token)
  }

  return refs
    .map((r) => byRef.get(`${r.fa2_address}:${r.token_id}`))
    .filter(Boolean)
    .map((token) => ({ ...token, key: `${token.fa2_address}:${token.token_id}` }))
}

// --- Coalesced single-token lookup (grid card thumbnails) ------------------
//
// Each cover-less CurationCard needs exactly one token for its fallback
// thumbnail, and the cards resolve their IPFS docs independently — so the
// lookups trickle in one at a time. Collect the refs that arrive within a
// short window and resolve them with a single GraphQL query instead of one
// query per card.

const BATCH_WINDOW_MS = 50
let batchRefs: CurationToken[] = []
let batchPromise: Promise<Map<string, any>> | null = null

function fetchCurationTokenBatched(
  ref: CurationToken
): Promise<any | undefined> {
  batchRefs.push(ref)
  if (!batchPromise) {
    batchPromise = new Promise((resolve, reject) => {
      setTimeout(() => {
        const refs = batchRefs
        batchRefs = []
        batchPromise = null
        fetchCurationTokens(refs)
          .then((tokens) => resolve(new Map(tokens.map((t) => [t.key, t]))))
          .catch(reject)
      }, BATCH_WINDOW_MS)
    })
  }
  return batchPromise.then((byKey) =>
    byKey.get(`${ref.fa2_address}:${ref.token_id}`)
  )
}

/** One referenced token, cached per ref; concurrent lookups share one query. */
export function useCurationToken(ref: CurationToken | undefined) {
  return useSWR(
    ref ? `curations:token:${ref.fa2_address}:${ref.token_id}` : null,
    () => fetchCurationTokenBatched(ref as CurationToken),
    { revalidateOnFocus: false, dedupingInterval: 60_000 }
  )
}

/** SWR hook wrapping fetchCurationTokens, keyed by the ordered ref list. */
export function useCurationTokens(refs: CurationToken[] | undefined) {
  const key = refs?.length
    ? `curations:tokens:${refs
        .map((r) => `${r.fa2_address}:${r.token_id}`)
        .join(',')}`
    : null
  return useSWR(key, () => fetchCurationTokens(refs as CurationToken[]), {
    revalidateOnFocus: false,
    dedupingInterval: 60_000,
  })
}
