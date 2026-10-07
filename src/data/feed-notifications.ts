// Which activity feeds have something new since the viewer last looked.
//
// This only asks about feeds the viewer has switched on, and only asks for the
// single newest row of each -- enough to compare against what they have seen.
// Nothing is switched on by default, so a viewer who never opens the settings
// costs no requests at all.
//
// Your own activity never counts. Listing a work or posting a comment is not
// news to the person who did it, so the viewer's address is excluded in the
// query rather than after the fact -- the newest row has to be somebody
// else's, or the feed has nothing to report.

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
// Enough recent rows to step over a run of the viewer's own activity. Asking
// the indexer to exclude them instead turns a 180ms query into one that does
// not come back, because the four address columns cannot all be indexed for a
// negated match -- so the exclusion happens here, over a handful of rows.
const NEWEST_EVENT_SCAN = 10

const NEWEST_EVENT_QUERY = gql`
  query NewestActivity($where: events_bool_exp!, $limit: Int!) {
    events(
      where: $where
      order_by: [{ level: desc }, { opid: desc }]
      limit: $limit
    ) {
      timestamp
      seller_address
      buyer_address
      from_address
      to_address
    }
  }
`

interface IndexedEvent {
  timestamp: string
  seller_address: string | null
  buyer_address: string | null
  from_address: string | null
  to_address: string | null
}

/** Every role a viewer can hold in a trade event. */
function isMine(event: IndexedEvent, address: string): boolean {
  return (
    event.seller_address === address ||
    event.buyer_address === address ||
    event.from_address === address ||
    event.to_address === address
  )
}

async function newestIndexedEvent(
  tokenWhere: Record<string, unknown>,
  viewer?: string
): Promise<string | null> {
  const data = await request<{ events: IndexedEvent[] }>(
    GRAPHQL_API,
    NEWEST_EVENT_QUERY,
    {
      limit: viewer ? NEWEST_EVENT_SCAN : 1,
      where: {
        token: { metadata_status: { _eq: 'processed' }, ...tokenWhere },
        fa2_address: { _eq: HEN_CONTRACT_FA2 },
        _or: globalActivityConds([]),
      },
    }
  )

  // If every recent row is the viewer's own, report nothing rather than
  // guessing: a quiet dot is better than one that fires at your own work.
  const newest = viewer
    ? data.events.find((event) => !isMine(event, viewer))
    : data.events[0]
  return newest?.timestamp ?? null
}

/** Newest applied call to one or more contracts, ignoring the viewer's own. */
async function newestCall(
  targets: string | string[],
  viewer?: string
): Promise<string | null> {
  const url = new URL(`${TZKT_API}/v1/operations/transactions`)
  if (Array.isArray(targets)) {
    url.searchParams.set('target.in', targets.join(','))
  } else {
    url.searchParams.set('target', targets)
  }
  if (viewer) {
    // A call the viewer made reaches the contract either directly or through
    // another contract, so both the signer and the originator have to be
    // ruled out. `initiator.ne` keeps the direct calls, whose initiator is
    // null, so the two together drop only what the viewer set in motion.
    url.searchParams.set('sender.ne', viewer)
    url.searchParams.set('initiator.ne', viewer)
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
async function newestDonation(
  contract: string,
  viewer?: string
): Promise<string | null> {
  const url = donationQuery(contract)
  // Donations are top-level only, so there is no initiator to rule out.
  if (viewer) url.searchParams.set('sender.ne', viewer)
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
const PROBES: Record<
  ActivityFeedKey,
  (viewer?: string) => Promise<string | null>
> = {
  social: (viewer) =>
    newestCall(
      [CHANNELS_V2_CONTRACT, POLL_COMMENTS_CONTRACT, TOKEN_COMMENTS_CONTRACT],
      viewer
    ),
  trades: (viewer) => newestIndexedEvent({}, viewer),
  text: (viewer) =>
    newestIndexedEvent(
      { mime_type: { _in: ['text/plain', 'text/markdown'] } },
      viewer
    ),
  curations: (viewer) => newestCall(CURATIONS_CONTRACT, viewer),
  calendar: (viewer) => newestCall(CALENDAR_CONTRACT, viewer),
  copyright: (viewer) => newestCall(COPYRIGHT_CONTRACT, viewer),
  wiki: (viewer) => newestCall(WIKI_CONTRACT, viewer),
  polls: (viewer) => newestCall(POLLS_CONTRACT, viewer),
  donations: (viewer) => newestDonation(DAO_TREASURY_CONTRACT, viewer),
  fountain: (viewer) => newestDonation(TEIA_FOUNTAIN_CONTRACT, viewer),
}

export const ACTIVITY_FEED_KEYS = ACTIVITY_FEEDS.map((f) => f.key)

/**
 * Feeds the viewer is watching that have moved on since they last looked.
 *
 * The probes run once per page load: a viewer who leaves the tab open is not
 * worth a standing cost, and the dot is there to catch them up next time they
 * arrive rather than to interrupt them.
 */
export function useFeedNotifications(viewerAddress?: string): {
  unreadFeeds: ActivityFeedKey[]
  total: number
} {
  const feedNotifications = useLocalSettings((st) => st.feedNotifications)
  const seen = useFeedReadStore((st) => st.seen)

  const enabled = ACTIVITY_FEED_KEYS.filter((key) => feedNotifications[key])

  const { data } = useSWR(
    enabled.length > 0
      ? ['feed-notifications', enabled.join(','), viewerAddress ?? 'anon']
      : null,
    async () => {
      // One at a time, not all at once. A dot nobody is waiting for is not
      // worth a burst of requests: firing ten together lands on the indexer's
      // rate limit alongside whatever the page is already loading, and the
      // feed the viewer actually came to read is what fails.
      const results: Record<string, string | null> = {}
      for (const key of enabled) {
        try {
          results[key] = await PROBES[key](viewerAddress)
        } catch {
          // A feed that cannot be reached simply has nothing new to say.
          results[key] = null
        }
      }
      return results
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
