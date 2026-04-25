/** Shared copy and validation for OBJKT listing (Swap tab + post-mint inline). */

export const SWAP_TEIA_FEE_DISCLOSURE =
  'The Teia marketplace fee is set to 2.5%. Fees get directed to ' +
  'the Teia DAO treasury multisig (KT1J9FYz29RBQi1oGLw8uXyACrzXzV1dHuvb)'

export const POST_MINT_SUSTAIN_TEIA =
  'Please help sustain Teia, swap your new OBJKT on Teia:'

const PRICE_MAX = 1e6
const LOW_PRICE_WARN_THRESHOLD = 0.1

/**
 * @param {(title: string, message?: string) => void} showModal
 * @param {number} value
 */
export function maybeWarnLowSwapPrice(showModal, value) {
  if (value <= LOW_PRICE_WARN_THRESHOLD) {
    showModal(
      `Price is really low (${value}ꜩ), for giveaways checkout hicetdono (dono.xtz.tools)`
    )
  }
}

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
