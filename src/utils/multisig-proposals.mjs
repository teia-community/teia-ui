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

/** Tez, written the way the rest of the site writes it. */
function formatTez(mutez) {
  return `${(mutez / 1000000).toLocaleString(undefined, {
    maximumFractionDigits: 2,
  })} ꜩ`
}

function shortAddress(address) {
  if (!address) return 'an address'
  return `${address.slice(0, 5)}…${address.slice(-5)}`
}

/** "to tz1ab…cdef" for one, "across 7 destinations" for several. */
function destinations(list) {
  if (list.length === 1) return `to ${shortAddress(list[0].destination)}`
  return `across ${list.length} destinations`
}

/**
 * What a proposal actually does, spelled out.
 *
 * The contract keeps the amounts and destinations, so a transfer proposal can
 * say how much and to whom rather than only that it is a transfer.
 */
export function describeProposal(proposal, { aliasOf, tokenInfo } = {}) {
  const name = (address) =>
    (aliasOf && aliasOf(address)) || shortAddress(address)

  switch (proposal.rawKind) {
    case 'transfer_mutez': {
      const list = proposal.mutezTransfers ?? []
      if (list.length === 0) return 'Transfer tez from the treasury'
      const total = list.reduce((sum, t) => sum + Number(t.amount || 0), 0)
      return `Transfer ${formatTez(total)} ${destinations(list)}`
    }
    case 'transfer_token': {
      const transfer = proposal.tokenTransfers
      const list = transfer?.distribution ?? []
      if (list.length === 0) return 'Transfer tokens from the treasury'
      const total = list.reduce((sum, t) => sum + Number(t.amount || 0), 0)
      // The contract stores the smallest unit; the token says how to read it.
      const token = tokenInfo?.(transfer.fa2, transfer.tokenId)
      return `Transfer ${formatTokenAmount(total, token)} ${destinations(list)}`
    }
    case 'add_user':
      return `Add ${name(proposal.user)} to the multisig`
    case 'remove_user':
      return `Remove ${name(proposal.user)} from the multisig`
    case 'minimum_votes':
      return `Change the votes a proposal needs to ${proposal.minimumVotes}`
    case 'expiration_time':
      return `Change how long proposals stay open to ${proposal.expirationTime} days`
    case 'lambda_function':
      return 'Run a lambda on the treasury contract'
    case 'text':
      return 'Text proposal'
    default:
      return proposal.kind
  }
}

/**
 * How far a proposal has come towards the votes it needs.
 *
 * One measure on one track: the share of the quorum already in favour. Votes
 * against do not move a proposal towards passing, so they are reported beside
 * the bar rather than drawn on it, where they would read as progress.
 */
export function quorumProgress(inFavour, quorum) {
  if (!Number.isFinite(quorum) || quorum <= 0) return 0
  return Math.max(0, Math.min(1, inFavour / quorum))
}

/**
 * A token amount written the way a person would say it.
 *
 * Amounts are stored in the token's smallest unit, so 3,100 USDt arrives as
 * 3,100,000,000. Shown raw it is unreadable and easy to misjudge by a factor
 * of a million, which is the mistake this exists to stop.
 */
export function formatTokenAmount(raw, { symbol, decimals } = {}) {
  const value = Number(raw)
  if (!Number.isFinite(value)) return String(raw ?? '')
  const places = Number.isFinite(decimals) ? decimals : 0
  const amount = places > 0 ? value / Math.pow(10, places) : value
  const text = amount.toLocaleString(undefined, {
    maximumFractionDigits: Math.min(places, 6),
  })
  return symbol ? `${text} ${symbol}` : text
}

/** The reverse: what a person typed, in the units the contract expects. */
export function toSmallestUnit(input, decimals) {
  const text = String(input ?? '')
    .replace(/,/g, '')
    .trim()
  // Number('') is 0, which would quietly become a zero transfer.
  if (text === '') return null
  const amount = Number(text)
  if (!Number.isFinite(amount) || amount < 0) return null
  const places = Number.isFinite(decimals) ? decimals : 0
  // Rounded rather than truncated, and via a string to avoid the float error
  // that turns 0.07 into 69999.99999 at six places.
  const scaled = Math.round(amount * Math.pow(10, places))
  return Number.isSafeInteger(scaled) ? scaled : null
}
