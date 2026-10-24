// Reading and writing the fee proposals each content contract keeps.
//
// A fee change is not a multisig proposal: the contract that charges the fee
// keeps its own little proposal book, where calling `set_post_fee` opens a
// proposal rather than setting anything. The helpers here translate between a
// stored fee's name and the entrypoint that proposes a new value for it.

/** The entrypoint that proposes a new value for the stored fee `field`. */
export function feeSetter(field) {
  return `set_${field}`
}

/** The stored fee a `set_…` entrypoint changes. */
export function feeField(entrypoint) {
  return String(entrypoint ?? '').replace(/^set_/, '')
}

/**
 * The one variant a proposal's action holds, as `{ set_post_fee: "25000" }`.
 * Returns null for an action shape we do not recognise, so an unexpected
 * proposal is skipped rather than rendered as nonsense.
 */
export function readFeeAction(action) {
  if (!action || typeof action !== 'object') return null
  const entrypoint = Object.keys(action)[0]
  if (!entrypoint) return null
  const value = action[entrypoint]
  if (typeof value !== 'string' && typeof value !== 'number') return null
  return { entrypoint, value: String(value) }
}
