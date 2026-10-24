// Reading the state of a multisig proposal.
//
// The contract records whether a proposal was executed and when it was made,
// but not whether an unexecuted one is still open. That falls out of the
// contract's expiration setting: past it, a proposal can no longer be voted
// on or executed, so it is expired rather than waiting.

/** The three states a proposal can be in, in the order the tab shows them. */
export const PROPOSAL_STATUSES = [
  { key: 'active', label: 'Active' },
  { key: 'executed', label: 'Executed' },
  { key: 'expired', label: 'Expired' },
]

/** Short labels for each kind of proposal, as the multisig interface uses. */
const KIND_LABELS = {
  text: 'TEXT',
  transfer_mutez: 'XTZ',
  transfer_token: 'FA2',
  add_user: '+MEM',
  remove_user: '−MEM',
  lambda_function: 'LAMBDA',
  minimum_votes: 'QUORUM',
  expiration_time: 'EXPIRY',
}

export function kindLabel(kind) {
  return KIND_LABELS[kind] || (kind ? kind.toUpperCase() : 'PROPOSAL')
}

/**
 * @param {{executed: boolean, timestamp: string}} proposal
 * @param {number} expirationDays  the contract's expiration_time setting
 * @param {number} [now]           epoch ms, for testing
 */
export function proposalStatus(proposal, expirationDays, now = Date.now()) {
  if (proposal.executed) return 'executed'
  const started = new Date(proposal.timestamp).getTime()
  if (!Number.isFinite(started) || !Number.isFinite(expirationDays)) {
    // Without a readable date there is no basis to call it expired, and
    // claiming a live proposal is dead is the worse mistake.
    return 'active'
  }
  const ends = started + expirationDays * 24 * 60 * 60 * 1000
  return now > ends ? 'expired' : 'active'
}

/** When an active proposal stops accepting votes. */
export function expiresAt(proposal, expirationDays) {
  const started = new Date(proposal.timestamp).getTime()
  if (!Number.isFinite(started) || !Number.isFinite(expirationDays)) return null
  return new Date(started + expirationDays * 24 * 60 * 60 * 1000).toISOString()
}

/**
 * How long until a moment in the future, in words.
 *
 * The site's getTimeAgo counts backwards and renders a future date as
 * "-64 minutes ago", so a deadline needs its own phrasing.
 */
export function timeUntil(iso, now = Date.now()) {
  const target = new Date(iso).getTime()
  if (!Number.isFinite(target)) return null
  const seconds = Math.round((target - now) / 1000)
  if (seconds <= 0) return 'any moment'

  const units = [
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60],
  ]
  for (const [unit, size] of units) {
    if (seconds >= size) {
      const value = Math.round(seconds / size)
      return `in ${value} ${unit}${value === 1 ? '' : 's'}`
    }
  }
  return 'in under a minute'
}

/**
 * Counts a proposal's votes against the membership.
 *
 * Members who did not vote are pending while a proposal is live, and have
 * abstained once it is settled -- the same count, but they mean different
 * things and the interface should not call a closed vote "pending".
 */
export function summariseVotes(votes = [], memberCount = 0, status = 'active') {
  const inFavour = votes.filter((v) => v.inFavour).length
  const against = votes.length - inFavour
  const silent = Math.max(0, memberCount - votes.length)
  return {
    inFavour,
    against,
    silent,
    silentLabel: status === 'active' ? 'pending' : 'abstain',
  }
}
