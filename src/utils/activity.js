// Activity-feed events.
//
// Resolves a teztok `events` row into a display descriptor:
//   { filterKey, marketKey, label, color, fromAttr, toAttr, showPrice, editions }
// or `null` when the event is marketplace plumbing that should not be shown.
// marketKey is 'primary' | 'secondary' for trades/listings/mints, else null.

import { BURN_ADDRESS } from '@constants'

/** Listing / swap creation across the marketplaces teztok indexes. */
export const LISTING_TYPES = [
  'TEIA_SWAP',
  'HEN_SWAP',
  'HEN_SWAP_V2',
  'VERSUM_SWAP',
  'OBJKT_ASK',
  'OBJKT_ASK_V2',
  'OBJKT_ASK_V3',
  'OBJKT_ASK_V3_PRE',
  'OBJKT_ASK_V3_2',
]

export const MINT_TYPES = ['HEN_MINT']

/** Listing types on Teia's own + the shared HEN marketplace (excludes objkt/versum). */
export const TEIA_LISTING_TYPES = ['TEIA_SWAP', 'HEN_SWAP', 'HEN_SWAP_V2']

/**
 * Event `type` values fetched for the activity feed. SALE is matched on
 * `implements` (its `type` is null) so it is not listed here.
 */
export const ACTIVITY_EVENT_TYPES = [
  ...MINT_TYPES,
  ...LISTING_TYPES,
  'FA2_TRANSFER',
]

/** Filter chips exposed in the UI, in display order. */
export const ACTIVITY_FILTERS = [
  { key: 'sale', label: 'Sale' },
  { key: 'buy', label: 'Buy' },
  { key: 'transfer', label: 'Transfer' },
  { key: 'list', label: 'List' },
  { key: 'create', label: 'Create' },
]

/** Market filter chips (primary = artist's first market, secondary = resale). */
export const MARKET_FILTERS = [
  { key: 'primary', label: 'Primary' },
  { key: 'secondary', label: 'Secondary' },
]

const isContract = (addr) => typeof addr === 'string' && addr.startsWith('KT1')

/**
 * Primary vs secondary market for a trade/listing: primary when the seller is
 * the token's artist (first sale), secondary otherwise.
 */
const marketOf = (event) => {
  const artist = event.token?.artist_address
  return artist && event.seller_address === artist ? 'primary' : 'secondary'
}

/**
 * Map a raw event to a display descriptor for the given viewer address, or
 * `null` if it should be hidden from the feed.
 *
 * @param {object} event teztok events row
 * @param {string} address the profile owner the feed is shown for
 */
export function resolveActivityEvent(event, address) {
  if (!event) return null

  if (event.implements === 'SALE') {
    const sold = !address || event.seller_address === address
    return {
      filterKey: sold ? 'sale' : 'buy',
      marketKey: marketOf(event),
      label: sold ? 'Sale' : 'Purchase',
      color: sold ? 'sale' : 'buy',
      fromAttr: 'seller',
      toAttr: 'buyer',
      showPrice: true,
      editions: 1,
    }
  }

  if (LISTING_TYPES.includes(event.type)) {
    return {
      filterKey: 'list',
      marketKey: marketOf(event),
      label: 'List',
      color: 'list',
      fromAttr: 'seller',
      toAttr: null,
      showPrice: true,
      editions: event.amount,
    }
  }

  if (event.type === 'FA2_TRANSFER') {
    if (event.to_address === BURN_ADDRESS) {
      return {
        filterKey: 'transfer',
        marketKey: null,
        label: 'Burn',
        color: 'burn',
        fromAttr: 'from',
        toAttr: 'burn',
        showPrice: false,
        editions: event.amount,
      }
    }

    if (isContract(event.from_address) || isContract(event.to_address)) {
      return null
    }
    return {
      filterKey: 'transfer',
      marketKey: null,
      label: 'Transfer',
      color: 'transfer',
      fromAttr: 'from',
      toAttr: 'to',
      showPrice: false,
      editions: event.amount,
    }
  }

  if (MINT_TYPES.includes(event.type)) {
    return {
      filterKey: 'create',
      marketKey: 'primary',
      label: 'Create',
      color: 'create',
      fromAttr: null,
      toAttr: null,
      showPrice: false,
      editions: event.editions,
    }
  }

  return null
}

export function formatTez(mutez) {
  if (mutez == null) return null
  const n = Number(mutez)
  if (!Number.isFinite(n)) return null
  return (n / 1e6).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}
