// The Teia multisig: who is on it, who used to be, and how they have voted.
//
// The contract stores only the current members, so the rest is read back from
// what it kept: `accept_membership` calls say when someone joined, executed
// `remove_user` proposals say when someone left, and the votes bigmap holds
// every vote ever cast, keyed by proposal and voter.

import useSWR from 'swr'
import { bytesToString } from '@taquito/utils'
import {
  DAO_TREASURY_CONTRACT,
  DAO_TOKEN_CONTRACT,
  DAO_TOKEN_DECIMALS,
} from '@constants'
import {
  buildMembers,
  tallyVotes,
  withActivity,
} from '@utils/dao-members.mjs'

const TZKT_API = import.meta.env.VITE_TZKT_API
/** The multisig has dozens of proposals and members, not thousands. */
const PAGE = 1000

export interface DaoMember {
  address: string
  alias: string | null
  joined: string | null
  left: string | null
  isCurrent: boolean
  tokens: number
  votesCast: number
  votesInFavour: number
  votes: { proposalId: string; inFavour: boolean }[]
}

export interface DaoProposal {
  id: string
  kind: string
  issuer: string
  timestamp: string
  executed: boolean
  positiveVotes: number
  text: string | null
  user: string | null
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`TzKT error: ${res.status}`)
  return res.json()
}

/** The bigmap pointers move if the contract is ever redeployed. */
async function bigmapPointers() {
  const maps = await fetchJson<{ path: string; ptr: number }[]>(
    `${TZKT_API}/v1/contracts/${DAO_TREASURY_CONTRACT}/bigmaps`
  )
  const find = (path: string) => maps.find((m) => m.path === path)?.ptr
  return { votes: find('votes'), proposals: find('proposals') }
}

/**
 * Text proposals keep their body as hex bytes, usually an ipfs:// link to the
 * written proposal, so they are decoded rather than shown as a wall of hex.
 */
function decodeText(value: unknown): string | null {
  if (!value) return null
  try {
    const text = bytesToString(String(value))
    return text || null
  } catch {
    return null
  }
}

/** A proposal's kind arrives as a one-key object, eg `{ transfer_mutez: {} }`. */
function proposalKind(value: Record<string, unknown>): string {
  const kind = value?.kind as Record<string, unknown> | undefined
  const name = kind ? Object.keys(kind)[0] : undefined
  return name ? name.replace(/_/g, ' ') : 'proposal'
}

/**
 * Everything the members tab shows, in one go. Each piece is small -- a few
 * dozen members, under a hundred proposals -- so they are fetched together
 * rather than per member as the page is browsed.
 */
export function useDaoMembers() {
  const { data, error, isValidating } = useSWR(
    'dao:members',
    async () => {
      const { votes: votesPtr, proposals: proposalsPtr } =
        await bigmapPointers()

      const [users, acceptances, proposalRows, voteRows] = await Promise.all([
        fetchJson<string[]>(
          `${TZKT_API}/v1/contracts/${DAO_TREASURY_CONTRACT}/storage?path=users`
        ),
        fetchJson<
          { sender: { address: string; alias?: string }; timestamp: string }[]
        >(
          `${TZKT_API}/v1/operations/transactions?target=${DAO_TREASURY_CONTRACT}` +
            `&entrypoint=accept_membership&status=applied&limit=${PAGE}` +
            `&select=sender,timestamp`
        ),
        proposalsPtr
          ? fetchJson<{ key: string; value: Record<string, any> }[]>(
              `${TZKT_API}/v1/bigmaps/${proposalsPtr}/keys?limit=${PAGE}&select=key,value`
            )
          : Promise.resolve([]),
        votesPtr
          ? fetchJson<
              { key: { nat: string; address: string }; value: boolean }[]
            >(
              `${TZKT_API}/v1/bigmaps/${votesPtr}/keys?limit=${PAGE}&active=true&select=key,value`
            )
          : Promise.resolve([]),
      ])

      const proposals: DaoProposal[] = proposalRows.map((row) => ({
        id: row.key,
        kind: proposalKind(row.value),
        issuer: String(row.value?.issuer ?? ''),
        timestamp: String(row.value?.timestamp ?? ''),
        executed: Boolean(row.value?.executed),
        positiveVotes: Number(row.value?.positive_votes ?? 0),
        text: decodeText(row.value?.text),
        user: (row.value?.user as string) ?? null,
      }))

      // A member leaves when a remove_user proposal naming them is executed.
      const removals = proposals
        .filter((p) => p.kind === 'remove user' && p.executed && p.user)
        .map((p) => ({ user: p.user as string, timestamp: p.timestamp }))

      const members = buildMembers({
        currentUsers: users,
        acceptances: acceptances.map((a) => ({
          address: a.sender.address,
          alias: a.sender.alias ?? null,
          timestamp: a.timestamp,
        })),
        removals,
      })

      const tallies = tallyVotes(
        voteRows.map((row) => ({
          proposalId: row.key.nat,
          address: row.key.address,
          inFavour: Boolean(row.value),
        }))
      )

      const tokens = await fetchTokenBalances(members.map((m) => m.address))

      return {
        members: withActivity(members, { tallies, tokens }) as DaoMember[],
        proposals: Object.fromEntries(proposals.map((p) => [p.id, p])),
      }
    },
    { revalidateOnFocus: false, dedupingInterval: 60_000 }
  )

  return {
    members: data?.members ?? [],
    proposals: data?.proposals ?? {},
    error,
    isLoading: !data && !error,
    isValidating,
  }
}

/** Teia token balances for a set of addresses, in one query. */
async function fetchTokenBalances(
  addresses: string[]
): Promise<Record<string, number>> {
  if (addresses.length === 0) return {}
  const url = new URL(`${TZKT_API}/v1/tokens/balances`)
  url.searchParams.set('account.in', addresses.join(','))
  url.searchParams.set('token.contract', DAO_TOKEN_CONTRACT)
  url.searchParams.set('limit', String(PAGE))
  url.searchParams.set('select', 'account,balance')

  const rows = await fetchJson<
    { account: { address: string }; balance: string }[]
  >(url.toString())

  const totals: Record<string, number> = {}
  for (const row of rows) {
    const address = row.account?.address
    if (!address) continue
    totals[address] =
      (totals[address] ?? 0) + Number(row.balance || 0) / DAO_TOKEN_DECIMALS
  }
  return totals
}

export default useDaoMembers
