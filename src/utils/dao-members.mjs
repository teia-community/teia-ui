// Who sits on the Teia multisig, who used to, and how they have voted.
//
// The contract only stores who is a member right now. Everything else is
// reconstructed from what it kept: an address accepted membership at some
// point, and may later have been removed by an executed proposal naming it.
// Anyone who accepted but is no longer in the list is emeritus.

/** Sort keys the members tab offers. */
export const MEMBER_SORTS = [
  { key: 'name', label: 'Name' },
  { key: 'joined', label: 'Join date' },
  { key: 'tokens', label: 'TEIA held' },
  { key: 'votes', label: 'Votes cast' },
]

/** What a member is called, for display and for sorting. */
export function memberName(member) {
  return member.alias || member.address
}

/**
 * Builds the member list from the pieces the contract exposes.
 *
 * @param {object} input
 * @param {string[]} input.currentUsers   addresses in storage right now
 * @param {{address: string, alias?: string|null, timestamp: string}[]} input.acceptances
 * @param {{user: string, timestamp: string}[]} input.removals  executed remove_user proposals
 */
export function buildMembers({
  currentUsers = [],
  acceptances = [],
  removals = [],
}) {
  const current = new Set(currentUsers)

  // Someone can be added, removed, and added again; the join date that means
  // anything is the one that started their current stretch, so later
  // acceptances win.
  const joinedAt = new Map()
  const aliases = new Map()
  for (const entry of acceptances) {
    if (!entry?.address) continue
    const previous = joinedAt.get(entry.address)
    if (!previous || entry.timestamp > previous) {
      joinedAt.set(entry.address, entry.timestamp)
    }
    if (entry.alias) aliases.set(entry.address, entry.alias)
  }

  const removedAt = new Map()
  for (const entry of removals) {
    if (!entry?.user) continue
    const previous = removedAt.get(entry.user)
    if (!previous || entry.timestamp > previous) {
      removedAt.set(entry.user, entry.timestamp)
    }
  }

  const addresses = new Set([...current, ...joinedAt.keys()])

  return [...addresses].map((address) => {
    const isCurrent = current.has(address)
    return {
      address,
      alias: aliases.get(address) || null,
      joined: joinedAt.get(address) || null,
      // A departure only counts for someone who actually left; a member who
      // was removed once and came back is current again.
      left: isCurrent ? null : removedAt.get(address) || null,
      isCurrent,
    }
  })
}

/** Current members first is handled by the page; this orders within a group. */
export function sortMembers(members, key) {
  const sorted = [...members]
  switch (key) {
    case 'joined':
      // Longest-serving first, and anyone whose join we cannot see goes last
      // rather than pretending to be the founder.
      return sorted.sort((a, b) => {
        if (!a.joined && !b.joined) return 0
        if (!a.joined) return 1
        if (!b.joined) return -1
        return a.joined < b.joined ? -1 : a.joined > b.joined ? 1 : 0
      })
    case 'tokens':
      return sorted.sort((a, b) => (b.tokens ?? 0) - (a.tokens ?? 0))
    case 'votes':
      return sorted.sort((a, b) => (b.votesCast ?? 0) - (a.votesCast ?? 0))
    case 'name':
    default:
      return sorted.sort((a, b) =>
        memberName(a).localeCompare(memberName(b), undefined, {
          sensitivity: 'base',
        })
      )
  }
}

/**
 * Turns the votes bigmap into per-member tallies and per-member records.
 *
 * @param {{proposalId: string, address: string, inFavour: boolean}[]} voteRows
 */
export function tallyVotes(voteRows = []) {
  const byMember = new Map()
  for (const row of voteRows) {
    if (!row?.address) continue
    const tally = byMember.get(row.address) || {
      votesCast: 0,
      votesInFavour: 0,
      votes: [],
    }
    tally.votesCast += 1
    if (row.inFavour) tally.votesInFavour += 1
    tally.votes.push({ proposalId: row.proposalId, inFavour: row.inFavour })
    byMember.set(row.address, tally)
  }
  return byMember
}

/** Attaches tallies and balances to members, leaving absent data at zero. */
export function withActivity(members, { tallies = new Map(), tokens = {} }) {
  return members.map((member) => {
    const tally = tallies.get(member.address)
    return {
      ...member,
      tokens: tokens[member.address] ?? 0,
      votesCast: tally?.votesCast ?? 0,
      votesInFavour: tally?.votesInFavour ?? 0,
      votes: tally?.votes ?? [],
    }
  })
}
