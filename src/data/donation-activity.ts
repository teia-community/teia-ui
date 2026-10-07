// Donations as a timeline: who sent tez to the DAO treasury or the fountain,
// and when.
//
// The donations page answers "who has given the most"; this answers "what has
// come in lately". Both read the same transfers and apply the same exclusions,
// so the two views cannot disagree about what counts as a donation.

import useSWRInfinite from 'swr/infinite'
import {
  DONATION_EXCLUDED_ADDRESSES,
  DONATION_REASSIGNMENTS,
} from '@constants'
import type { ActivitySort } from '@data/messaging/useSocialActivity'

const TZKT_API = import.meta.env.VITE_TZKT_API
const PAGE_SIZE = 50

export interface DonationActivityItem {
  id: number
  sender: string
  senderAlias: string | null
  /** Tez, not mutez. */
  amount: number
  timestamp: string
  ophash: string
}

interface RawTransfer {
  id: number
  hash: string
  timestamp: string
  amount: number
  sender: { address: string; alias?: string } | null
}

/**
 * Same rule as the donations page: no contracts, no payout wallets. The
 * contract half is already applied by the query; it stays here so the rule
 * reads in one place and holds whatever the indexer returns.
 */
function isDonor(address: string | undefined): boolean {
  if (!address) return false
  if (address.startsWith('KT1')) return false
  return !DONATION_EXCLUDED_ADDRESSES.includes(address)
}

/**
 * A donation routed through a middleman is credited to the donor it came from,
 * the same correction the donations page applies to the totals. Matching on
 * the operation keeps one listed transfer in step with one adjusted total.
 */
function reassign(item: DonationActivityItem): DonationActivityItem {
  const correction = DONATION_REASSIGNMENTS.find(
    (entry) => entry.ophash === item.ophash
  )
  if (!correction) return item
  return { ...item, sender: correction.to, senderAlias: correction.toAlias }
}

interface DonationPage {
  items: DonationActivityItem[]
  /** Whether the indexer returned a full page, before exclusions. */
  full: boolean
}

/**
 * The indexer query that selects donations to one contract, shared so that
 * anything else asking "what counts as a donation" asks the same question.
 *
 * Marketplace fees reach the treasury as internal operations, and they
 * outnumber donations roughly 100 to 1. Asking the indexer for top-level
 * operations only is the same cut as dropping KT1 senders below -- an
 * internal transfer is always sent by a contract -- but it is made before the
 * page is filled, so a page of 50 is 50 candidate donations rather than 50 fee
 * transfers. The payout wallets post daily, so they go too.
 */
export function donationQuery(contract: string): URL {
  const url = new URL(`${TZKT_API}/v1/operations/transactions`)
  url.searchParams.set('target', contract)
  url.searchParams.set('amount.gt', '0')
  url.searchParams.set('status', 'applied')
  url.searchParams.set('initiator.null', 'true')
  if (DONATION_EXCLUDED_ADDRESSES.length > 0) {
    url.searchParams.set('sender.ni', DONATION_EXCLUDED_ADDRESSES.join(','))
  }
  return url
}

async function fetchDonationPage(
  contract: string,
  offset: number,
  sort: 'asc' | 'desc'
): Promise<DonationPage> {
  const url = donationQuery(contract)
  url.searchParams.set(`sort.${sort}`, 'id')
  url.searchParams.set('limit', String(PAGE_SIZE))
  url.searchParams.set('select', 'id,hash,timestamp,amount,sender')
  if (offset > 0) url.searchParams.set('offset', String(offset))

  const res = await fetch(url.toString())
  if (!res.ok) throw new Error(`TzKT error: ${res.status}`)
  const rows: RawTransfer[] = await res.json()

  const items: DonationActivityItem[] = []
  for (const row of rows) {
    const address = row.sender?.address
    if (!address || !isDonor(address)) continue
    items.push(
      reassign({
        id: row.id,
        sender: address,
        senderAlias: row.sender?.alias ?? null,
        amount: row.amount / 1e6,
        timestamp: row.timestamp,
        ophash: row.hash,
      })
    )
  }

  return { items, full: rows.length === PAGE_SIZE }
}

/**
 * Paginated donation timeline for one contract.
 *
 * A page can come back short once excluded senders are dropped, so the end is
 * decided by what the indexer returned rather than by what is left after
 * filtering.
 */
export function useDonationTimeline(
  contract: string,
  sort: ActivitySort = 'newest'
) {
  const dir = sort === 'oldest' ? 'asc' : 'desc'

  const { data, error, size, setSize, isValidating } = useSWRInfinite(
    (pageIndex: number, previous: DonationPage | null) => {
      // A page can be empty after exclusions and still have more behind it,
      // so paging stops on what the indexer returned, not on what survived.
      if (previous && !previous.full) return null
      return contract ? [`donations:${contract}`, sort, pageIndex] : null
    },
    // SWR v1 spreads array-key parts as separate fetcher args.
    (_ns: string, _sort: ActivitySort, pageIndex: number) =>
      fetchDonationPage(contract, pageIndex * PAGE_SIZE, dir),
    { revalidateFirstPage: false, revalidateOnFocus: false }
  )

  const items: DonationActivityItem[] = data
    ? data.flatMap((page) => page.items)
    : []

  return {
    items,
    error,
    isLoadingInitial: !data && !error,
    isLoadingMore: Boolean(
      isValidating && data && typeof data[size - 1] === 'undefined'
    ),
    isReachingEnd: Boolean(data && data[data.length - 1]?.full === false),
    loadMore: () => setSize(size + 1),
  }
}

export default useDonationTimeline
