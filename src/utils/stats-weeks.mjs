// Week buckets for the chain statistics.
//
// The indexer can count what falls between two timestamps but cannot group by
// week, so the page asks for one count per week and stitches them together.
// The weeks are built here, where they can be checked.

const WEEK = 7 * 24 * 60 * 60 * 1000

/**
 * The last `weeks` whole weeks, oldest first, each as the half-open range
 * [from, to) the indexer is asked about.
 *
 * @param {number} weeks
 * @param {number} [now]  epoch ms, for testing
 */
export function weekBuckets(weeks, now = Date.now()) {
  const end = Math.floor(now / WEEK) * WEEK + WEEK
  const out = []
  for (let i = weeks - 1; i >= 0; i -= 1) {
    const from = new Date(end - (i + 1) * WEEK)
    const to = new Date(end - i * WEEK)
    out.push({
      // The label is the week's first day, as the messaging charts show it.
      week: from.toISOString().slice(0, 10),
      from: from.toISOString(),
      to: to.toISOString(),
    })
  }
  return out
}

/** Mutez as tez, for a figure people read rather than compute with. */
export function tezFromMutez(mutez) {
  const value = Number(mutez)
  if (!Number.isFinite(value)) return 0
  return value / 1_000_000
}
