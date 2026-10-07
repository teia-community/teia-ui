// Which activity feeds have something new since the viewer last looked.
//
// This only asks about feeds the viewer has switched on, and only asks for the
// single newest row of each -- enough to compare against what they have seen.
// Nothing is switched on by default, so a viewer who never opens the settings
// costs no requests at all.

import useSWR from 'swr'
import { request, gql } from 'graphql-request'
import {
  ACTIVITY_FEEDS,
  CALENDAR_CONTRACT,
  CHANNELS_V2_CONTRACT,
  COPYRIGHT_CONTRACT,
  CURATIONS_CONTRACT,
  DAO_TREASURY_CONTRACT,
  HEN_CONTRACT_FA2,
  POLLS_CONTRACT,
  POLL_COMMENTS_CONTRACT,
  TEIA_FOUNTAIN_CONTRACT,
  TOKEN_COMMENTS_CONTRACT,
  WIKI_CONTRACT,
} from '@constants'
import type { ActivityFeedKey } from '@constants'
import { globalActivityConds } from '@utils/activity'
import { useLocalSettings } from '@context/localSettingsStore'
import { useFeedReadStore } from '@context/feedReadStore'
import { donationQuery } from '@data/donation-activity'

const TZKT_API = import.meta.env.VITE_TZKT_API
const GRAPHQL_API = import.meta.env.VITE_TEIA_GRAPHQL_API

/** Newest event timestamp from the token indexer, for a feed's own filter. */
const NEWEST_EVENT_QUERY = gql`
  query NewestActivity($where: events_bool_exp!) {
    events(where: $where, order_by: [{ level: desc }, { opid: desc }], limit: 1) {
      timestamp
    }
  }
`

async function newestIndexedEvent(
  tokenWhere: Record<string, unknown>
): Promise<string | null> {
  const data = await request<{ events: { timestamp: string }[] }>(
    GRAPHQL_API,
    NEWEST_EVENT_QUERY,
    {
      where: {
        token: { metadata_status: { _eq: 'processed' }, ...tokenWhere },
        fa2_address: { _eq: HEN_CONTRACT_FA2 },
        _or: globalActivityConds([]),
      },
    }
  )
  return data.events[0]?.timestamp ?? null
}

/** Newest applied call to one or more contracts. */
async function newestCall(targets: string | string[]): Promise<string | null> {
  const url = new URL(`${TZKT_API}/v1/operations/transactions`)
  if (Array.isArray(targets)) {
    url.searchParams.set('target.in', targets.join(','))
  } else {
    url.searchParams.set('target', targets)
  }
  url.searchParams.set('status', 'applied')
  url.searchParams.set('sort.desc', 'id')
  url.searchParams.set('limit', '1')
  url.searchParams.set('select', 'timestamp')
  const res = await fetch(url.toString())
  if (!res.ok) throw new Error(`TzKT error: ${res.status}`)
  const rows: string[] = await res.json()
  return rows[0] ?? null
}

/** Newest donation to one contract, under the rules the feed itself uses. */
async function newestDonation(contract: string): Promise<string | null> {
  const url = donationQuery(contract)
  url.searchParams.set('sort.desc', 'id')
  url.searchParams.set('limit', '1')
  url.searchParams.set('select', 'timestamp')
  const res = await fetch(url.toString())
  if (!res.ok) throw new Error(`TzKT error: ${res.status}`)
  const rows: string[] = await res.json()
  return rows[0] ?? null
}

/**
 * How to find the newest row of each feed.
 *
 * For the contract-backed feeds this is the newest call to the contract, which
 * is a shade broader than the rows the feed lists -- a call the feed does not
 * render still counts as activity. Donations are the exception that matters,
 * because fee transfers would otherwise mark the feed new every few minutes,
 * so those reuse the feed's own query.
 */
const PROBES: Record<ActivityFeedKey, () => Promise<string | null>> = {
  social: () =>
    newestCall([
      CHANNELS_V2_CONTRACT,
      POLL_COMMENTS_CONTRACT,
      TOKEN_COMMENTS_CONTRACT,
    ]),
  trades: () => newestIndexedEvent({}),
  text: () =>
    newestIndexedEvent({ mime_type: { _in: ['text/plain', 'text/markdown'] } }),
  curations: () => newestCall(CURATIONS_CONTRACT),
  calendar: () => newestCall(CALENDAR_CONTRACT),
  copyright: () => newestCall(COPYRIGHT_CONTRACT),
  wiki: () => newestCall(WIKI_CONTRACT),
  polls: () => newestCall(POLLS_CONTRACT),
  donations: () => newestDonation(DAO_TREASURY_CONTRACT),
  fountain: () => newestDonation(TEIA_FOUNTAIN_CONTRACT),
}

export const ACTIVITY_FEED_KEYS = ACTIVITY_FEEDS.map((f) => f.key)

/**
 * Feeds the viewer is watching that have moved on since they last looked.
 *
 * The probes run once per page load: a viewer who leaves the tab open is not
 * worth a standing cost, and the dot is there to catch them up next time they
 * arrive rather than to interrupt them.
 */
export function useFeedNotifications(): {
  unreadFeeds: ActivityFeedKey[]
  total: number
} {
  const feedNotifications = useLocalSettings((st) => st.feedNotifications)
  const seen = useFeedReadStore((st) => st.seen)

  const enabled = ACTIVITY_FEED_KEYS.filter((key) => feedNotifications[key])

  const { data } = useSWR(
    enabled.length > 0 ? ['feed-notifications', enabled.join(',')] : null,
    async () => {
      const results = await Promise.all(
        enabled.map(async (key) => {
          try {
            return [key, await PROBES[key]()] as const
          } catch {
            // A feed that cannot be reached simply has nothing new to say.
            return [key, null] as const
          }
        })
      )
      return Object.fromEntries(results) as Record<string, string | null>
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateIfStale: false,
    }
  )

  const unreadFeeds = enabled.filter((key) => {
    const newest = data?.[key]
    if (!newest) return false
    const lastSeen = seen[key]
    // A feed switched on for the first time starts from now, so turning one on
    // does not light the dot for everything that happened before.
    if (!lastSeen) return false
    return newest > lastSeen
  })

  return { unreadFeeds, total: unreadFeeds.length }
}

export default useFeedNotifications
