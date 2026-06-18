// Moderator contract data layer (reusable across any moderator contract).
//
// The moderator contract is a mini-multisig. Adding or removing a moderator is
// not immediate: `add_moderator` / `remove_moderator` each SUBMIT a proposal,
// multisig users then `vote_proposal`, and once `positive_votes` reaches the
// multisig's `minimum_votes` any multisig user can `execute_proposal`.

import useSWR, { mutate } from 'swr'
import { Tezos } from '@context/userStore'
import { useModalStore } from '@context/modalStore'

const TZKT_API = import.meta.env.VITE_TZKT_API

export type ModeratorAction =
  | 'add_moderator'
  | 'remove_moderator'
  | 'update_multisig_address'
  | 'update_metadata'

export interface ModeratorProposal {
  id: number
  action: ModeratorAction
  /** Target address for add/remove/update_multisig_address actions. */
  address: string | null
  executed: boolean
  issuer: string
  /** ISO timestamp the proposal was submitted. */
  timestamp: string
  positiveVotes: number
  minimumVotes: number
}

export interface ModeratorVote {
  proposalId: number
  voter: string
  approval: boolean
}

// ---------------------------------------------------------------------------
// Reads (TzKT)
// ---------------------------------------------------------------------------

/** The current moderator set (storage `moderators`). */
export async function fetchModeratorSet(contract: string): Promise<string[]> {
  const res = await fetch(
    `${TZKT_API}/v1/contracts/${contract}/storage?path=moderators`
  )
  if (!res.ok) throw new Error(`TzKT error: ${res.status}`)
  const data = await res.json()
  return Array.isArray(data) ? data : []
}

interface RawProposal {
  key: string
  value: {
    action: Record<string, unknown>
    executed: boolean
    issuer: string
    timestamp: string
    positive_votes: string
    minimum_votes: string
  }
}

/** All proposals (open + executed), newest first. */
export async function fetchModeratorProposals(
  contract: string
): Promise<ModeratorProposal[]> {
  const res = await fetch(
    `${TZKT_API}/v1/contracts/${contract}/bigmaps/proposals/keys?limit=200&active=true`
  )
  if (!res.ok) throw new Error(`TzKT error: ${res.status}`)
  const rows: RawProposal[] = await res.json()
  return rows
    .map((r) => {
      const action = Object.keys(r.value.action)[0] as ModeratorAction
      const target = r.value.action[action]
      return {
        id: Number(r.key),
        action,
        address: typeof target === 'string' ? target : null,
        executed: r.value.executed,
        issuer: r.value.issuer,
        timestamp: r.value.timestamp,
        positiveVotes: Number(r.value.positive_votes),
        minimumVotes: Number(r.value.minimum_votes),
      }
    })
    .sort((a, b) => b.id - a.id)
}

/** Votes cast on this contract's proposals (optionally scoped to one voter). */
export async function fetchModeratorVotes(
  contract: string,
  address?: string
): Promise<ModeratorVote[]> {
  const filter = address ? `&key.address=${address}` : ''
  const res = await fetch(
    `${TZKT_API}/v1/contracts/${contract}/bigmaps/votes/keys?limit=1000&active=true${filter}`
  )
  if (!res.ok) throw new Error(`TzKT error: ${res.status}`)
  const rows: { key: { nat: string; address: string }; value: boolean }[] =
    await res.json()
  return rows.map((r) => ({
    proposalId: Number(r.key.nat),
    voter: r.key.address,
    approval: r.value,
  }))
}

/** Proposal expiration window (days) read from the linked multisig storage. */
export async function fetchMultisigExpiration(
  multisig: string
): Promise<number> {
  const res = await fetch(
    `${TZKT_API}/v1/contracts/${multisig}/storage?path=expiration_time`
  )
  if (!res.ok) throw new Error(`TzKT error: ${res.status}`)
  return Number(await res.json())
}

// ---------------------------------------------------------------------------
// SWR hooks
// ---------------------------------------------------------------------------

const SET_KEY = (c: string) => ['mods:set', c]
const PROPOSALS_KEY = (c: string) => ['mods:proposals', c]

export function useModeratorSet(contract: string) {
  return useSWR<string[]>(SET_KEY(contract), () => fetchModeratorSet(contract), {
    revalidateOnFocus: false,
    dedupingInterval: 30_000,
  })
}

export function useModeratorProposals(contract: string) {
  return useSWR<ModeratorProposal[]>(
    PROPOSALS_KEY(contract),
    () => fetchModeratorProposals(contract),
    { revalidateOnFocus: false, dedupingInterval: 15_000 }
  )
}

export function useModeratorVotes(contract: string, address?: string) {
  return useSWR<ModeratorVote[]>(
    ['mods:votes', contract, address ?? null],
    () => fetchModeratorVotes(contract, address),
    { revalidateOnFocus: false, dedupingInterval: 15_000 }
  )
}

export function useMultisigExpiration(multisig?: string) {
  return useSWR<number>(
    multisig ? ['mods:expiration', multisig] : null,
    () => fetchMultisigExpiration(multisig as string),
    { revalidateOnFocus: false, dedupingInterval: 60_000 }
  )
}

// ---------------------------------------------------------------------------
// Writes (Taquito)
// ---------------------------------------------------------------------------

function friendlyModError(e: unknown): unknown {
  const raw = JSON.stringify(e ?? '')
  if (raw.includes('MOD_NOT_MULTISIG_USER'))
    return new Error('Only DAO multisig members can perform this action.')
  if (raw.includes('MOD_NOT_ENOUGH_VOTES'))
    return new Error('This proposal does not have enough votes to execute yet.')
  if (raw.includes('MOD_ALREADY_EXECUTED'))
    return new Error('This proposal has already been executed.')
  if (raw.includes('MOD_PROPOSAL_EXPIRED'))
    return new Error('This proposal has expired and can no longer be executed.')
  if (raw.includes('MOD_NO_PROPOSAL'))
    return new Error('That proposal no longer exists.')
  return e
}

/** Revalidate every cache entry tied to a moderator contract after a write. */
async function invalidate(contract: string) {
  await Promise.all([
    mutate(SET_KEY(contract)),
    mutate(PROPOSALS_KEY(contract)),
    mutate(
      (key) =>
        Array.isArray(key) && key[0] === 'mods:votes' && key[1] === contract
    ),
  ])
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ContractMethod = { send: () => Promise<any> }

async function runAction(
  contract: string,
  title: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  build: (c: any) => ContractMethod,
  successMessage: string
): Promise<string | undefined> {
  const { step, show, showError } = useModalStore.getState()
  step(title, 'Waiting for wallet confirmation', true)
  try {
    const c = await Tezos.wallet.at(contract)
    const op = await build(c).send()
    step(title, 'Awaiting confirmation...')
    await op.confirmation()
    await invalidate(contract)
    show(title, successMessage)
    return op.opHash
  } catch (e) {
    const friendly = friendlyModError(e)
    showError(title, friendly)
    throw friendly
  }
}

/** Submit a proposal to add `address` as a moderator. */
export function proposeAddModerator(contract: string, address: string) {
  return runAction(
    contract,
    'Add Moderator',
    (c) => c.methodsObject.add_moderator(address),
    'Proposal to add a moderator was submitted. It now needs multisig votes.'
  )
}

/** Submit a proposal to remove `address` from the moderators. */
export function proposeRemoveModerator(contract: string, address: string) {
  return runAction(
    contract,
    'Remove Moderator',
    (c) => c.methodsObject.remove_moderator(address),
    'Proposal to remove a moderator was submitted. It now needs multisig votes.'
  )
}

/** Vote (approve/reject) on an existing proposal. */
export function voteModeratorProposal(
  contract: string,
  proposalId: number,
  approval: boolean
) {
  return runAction(
    contract,
    `Vote on Proposal #${proposalId}`,
    (c) => c.methodsObject.vote_proposal({ proposal_id: proposalId, approval }),
    'Your vote was recorded.'
  )
}

/** Execute an approved proposal, applying its action on-chain. */
export function executeModeratorProposal(contract: string, proposalId: number) {
  return runAction(
    contract,
    `Execute Proposal #${proposalId}`,
    (c) => c.methodsObject.execute_proposal(proposalId),
    'Proposal executed.'
  )
}
