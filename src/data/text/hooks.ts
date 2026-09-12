// SWR hooks for Teia Text feeds.

import useSWR from 'swr'
import { request } from 'graphql-request'
import { TEIA_MULTISIG_BLOG_TAG } from '@constants'
import { useModerators, useTokenHolders } from '@data/roles'
import { useMultisigAddresses } from '@data/swr'
import laggy from '@utils/swr-laggy-middleware'
import {
  TEXT_POSTS_QUERY,
  TEXT_POSTS_BY_ARTIST_QUERY,
  OFFICIAL_TEXT_POSTS_QUERY,
  HOLDER_TEXT_POSTS_QUERY,
} from './queries'

const GRAPHQL_API = import.meta.env.VITE_TEIA_GRAPHQL_API

const FEED_OPTIONS = {
  revalidateIfStale: false,
  revalidateOnFocus: false,
  use: [laggy],
}

/** Community feed: the latest posts from anyone. */
export function useTextPosts(limit = 100) {
  return useSWR<any>(
    ['text-community'],
    () => request(GRAPHQL_API, TEXT_POSTS_QUERY, { limit }),
    FEED_OPTIONS
  )
}

/** One author's posts (profile Text tab, Your Posts). */
export function useTextPostsByArtist(address?: string) {
  return useSWR<any>(
    address ? ['text-posts-by-artist', address] : null,
    () => request(GRAPHQL_API, TEXT_POSTS_BY_ARTIST_QUERY, { address }),
    FEED_OPTIONS
  )
}

/** Bulletin feed: tagged posts from multisig members and moderators. */
export function useOfficialTextPosts(limit = 100) {
  const multisigAddresses: string[] = useMultisigAddresses()
  const { data: moderators } = useModerators()
  const addresses = [...new Set([...multisigAddresses, ...(moderators || [])])]
  return useSWR<any>(
    addresses.length > 0 ? ['text-official', addresses] : null,
    () =>
      request(GRAPHQL_API, OFFICIAL_TEXT_POSTS_QUERY, {
        addresses,
        tag: TEIA_MULTISIG_BLOG_TAG,
        limit,
      }),
    FEED_OPTIONS
  )
}

/**
 * TEIA Members feed: text posts whose author currently holds TEIA, from the
 * same holder set that drives the profile's TEIA HOLDER badge. Filtered
 * server-side so the feed gets the latest `limit` holder posts, not just the
 * holders among recent posts.
 */
export function useHolderTextPosts(limit = 100) {
  const { data: holders, error: holdersError } = useTokenHolders()
  const result = useSWR<any>(
    // Keyed on the set's size rather than ~2.6k addresses, so SWR isn't hashing
    // a huge key on every render.
    holders?.size ? ['text-holders', holders.size, limit] : null,
    () =>
      request(GRAPHQL_API, HOLDER_TEXT_POSTS_QUERY, {
        addresses: [...(holders as Set<string>)],
        limit,
      }),
    FEED_OPTIONS
  )
  const error = result.error || holdersError
  // SWR v1 has no `isLoading`: loading until the posts or an error arrive.
  return { ...result, error, isLoading: !error && !result.data }
}
