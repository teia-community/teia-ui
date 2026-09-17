/** Shared copy and validation for OBJKT listing (Swap tab + post-mint inline). */

export const SWAP_TEIA_FEE_DISCLOSURE =
  'The Teia marketplace fee is set to 2.5%. Fees get directed to ' +
  'the Teia DAO treasury multisig (KT1J9FYz29RBQi1oGLw8uXyACrzXzV1dHuvb)'

export const POST_MINT_SUSTAIN_TEIA =
  'Please help sustain Teia, swap your new OBJKT on Teia:'

export const SWAP_ZERO_PRICE_GAS_NOTICE =
  'Listing for 0 ꜩ makes this OBJKT free to collect, but Tezos network ' +
  'fees still apply: you pay them to list it, and collectors pay them to ' +
  'collect it.'

const PRICE_MAX = 1e6

/**
 * @param {unknown} raw
 * @param {number} totalOwned
 * @returns {number}
 */
export function clampSwapAmountOnBlur(raw, totalOwned) {
  const n = parseInt(String(raw), 10)
  if (Number.isNaN(n) || n < 1) {
    return 1
  }
  return Math.min(n, totalOwned)
}

/**
 * @param {unknown} raw
 * @returns {number}
 */
export function clampSwapPriceOnBlur(raw) {
  let val = parseFloat(String(raw))
  if (Number.isNaN(val)) {
    return 0
  }
  if (val > PRICE_MAX) {
    return PRICE_MAX
  }
  if (val < 0) {
    return 0
  }
  return val
}
