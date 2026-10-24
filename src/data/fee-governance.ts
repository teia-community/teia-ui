// Proposing, voting on and carrying out a fee change.
//
// Fees do not change through the treasury multisig. Each contract that charges
// a fee keeps its own proposal book: calling `set_post_fee` opens a proposal
// rather than setting the fee, multisig members vote inside that contract, and
// once the votes are there any member executes it. The quorum is the
// multisig's, which is why the number comes in from the caller rather than
// from these contracts.

import useSWR, { mutate } from 'swr'
import { Tezos } from '@context/userStore'
import { useModalStore } from '@context/modalStore'
import { readFeeAction } from '@utils/fee-governance.mjs'
import { FEE_CONTRACTS, type FeeGovernance } from './teia-fees'
import { tzktFetch } from './tzkt'

const TZKT_API = import.meta.env.VITE_TZKT_API

/** The contracts whose fees change through their own vote. */
const VOTABLE = FEE_CONTRACTS.filter((c) => c.gov)

export interface FeeProposal {
  /** Proposal ids repeat across contracts, so the contract is part of this. */
  key: string
  contractKey: string
  contractName: string
  address: string
  gov: FeeGovernance
  id: number
  /** The entrypoint the proposal will call, as `set_post_fee`. */
  entrypoint: string
  /** The fee it would set, in mutez. */
  value: string
  executed: boolean
  issuer: string
  timestamp: string
  positiveVotes: number
  negativeVotes: number
  /** How the connected wallet voted, or null if it has not. */
  myVote: boolean | null
}

interface RawProposal {
  key: string
  value: {
    action: Record<string, unknown>
    executed: boolean
    issuer: string
    timestamp: string
    positive_votes: string
    negative_votes: string
  }
}

const keys = <T,>(url: string) => tzktFetch<T[]>(url)

async function fetchFeeProposals(address: string | null) {
  const perContract = await Promise.all(
    VOTABLE.map(async (contract) => {
      const gov = contract.gov as FeeGovernance
      const rows = await keys<RawProposal>(
        `${TZKT_API}/v1/contracts/${contract.address}/bigmaps/${gov.proposalsPath}/keys?limit=200&active=true`
      ).catch(() => [])

      const proposals = rows.flatMap((row) => {
        // A contract's book also holds pauses and recipient changes; this
        // page is about fees, so anything else is left to the contract.
        const action = readFeeAction(row.value.action)
        if (!action?.entrypoint.startsWith('set_')) return []
        if (!action.entrypoint.endsWith('_fee')) return []
        return [
          {
            key: `${contract.key}:${row.key}`,
            contractKey: contract.key,
            contractName: contract.name,
            address: contract.address,
            gov,
            id: Number(row.key),
            entrypoint: action.entrypoint,
            value: action.value,
            executed: row.value.executed,
            issuer: row.value.issuer,
            timestamp: row.value.timestamp,
            positiveVotes: Number(row.value.positive_votes),
            negativeVotes: Number(row.value.negative_votes),
            myVote: null as boolean | null,
          },
        ]
      })

      // Only worth asking about votes where there is something to vote on.
      if (!proposals.length || !address) return proposals
      const votes = await keys<{ key: { nat: string }; value: boolean }>(
        `${TZKT_API}/v1/contracts/${contract.address}/bigmaps/${gov.votesPath}/keys?limit=1000&active=true&key.address=${address}`
      ).catch(() => [])
      const mine = new Map(votes.map((v) => [Number(v.key.nat), v.value]))
      return proposals.map((p) => ({
        ...p,
        myVote: mine.has(p.id) ? (mine.get(p.id) as boolean) : null,
      }))
    })
  )

  return perContract.flat().sort((a, b) => b.timestamp.localeCompare(a.timestamp))
}

/** Every open and past fee proposal, newest first. */
export function useFeeProposals(address?: string | null) {
  const { data, error } = useSWR<FeeProposal[]>(
    ['fees:governance', address ?? null],
    (_key: string, voter: string | null) => fetchFeeProposals(voter),
    { revalidateOnFocus: false, dedupingInterval: 15_000 }
  )
  return { proposals: data ?? [], error, isLoading: !data && !error }
}

async function invalidate() {
  await Promise.all([
    mutate((key: unknown) => Array.isArray(key) && key[0] === 'fees:governance'),
    mutate('teia:fees'),
  ])
}

function friendlyError(e: unknown): string {
  const raw = JSON.stringify(e ?? '') + ((e as { message?: string })?.message ?? '')
  if (/aborted|rejected|UserAbortedError/i.test(raw)) {
    return 'Cancelled in the wallet.'
  }
  if (/NOT_MULTISIG|not a user|NOT_USER/i.test(raw)) {
    return 'Only core team members can propose or vote on a fee change.'
  }
  if (/ALREADY_VOTED|already voted/i.test(raw)) {
    return 'You have already voted on this proposal.'
  }
  if (/ALREADY_EXECUTED/i.test(raw)) {
    return 'This proposal has already been carried out.'
  }
  if (/EXPIRED/i.test(raw)) {
    return 'This proposal has expired and can no longer be acted on.'
  }
  if (/NOT_ENOUGH_VOTES|MIN_VOTES/i.test(raw)) {
    return 'This proposal does not have enough votes yet.'
  }
  return (e as { message?: string })?.message || 'The transaction failed.'
}

async function run(
  address: string,
  title: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  build: (c: any) => { send: () => Promise<any> },
  successMessage: string
) {
  const { step, show, showError } = useModalStore.getState()
  step(title, 'Waiting for wallet confirmation', true)
  try {
    const contract = await Tezos.wallet.at(address)
    const op = await build(contract).send()
    step(title, 'Awaiting confirmation...')
    await op.confirmation()
    await invalidate()
    show(title, successMessage)
    return op.opHash
  } catch (e) {
    const friendly = friendlyError(e)
    showError(title, friendly)
    throw new Error(friendly)
  }
}

/**
 * Open a proposal to set one fee to `mutez`. The entrypoint is named after the
 * fee it changes, and calling it proposes rather than sets.
 */
export function proposeFeeChange(
  address: string,
  entrypoint: string,
  mutez: number
) {
  return run(
    address,
    'Propose a fee change',
    (c) => c.methodsObject[entrypoint](mutez),
    'Proposal submitted. It now needs votes from the core team.'
  )
}

/** Vote for or against a fee proposal, inside the contract that holds it. */
export function voteFeeProposal(
  proposal: FeeProposal,
  approval: boolean
) {
  return run(
    proposal.address,
    `Vote on ${proposal.contractName} fee change #${proposal.id}`,
    (c) =>
      c.methodsObject[proposal.gov.voteEntrypoint]({
        proposal_id: proposal.id,
        approval,
      }),
    approval ? 'Voted in favour.' : 'Voted against.'
  )
}

/** Carry out a fee proposal that has the votes it needs. */
export function executeFeeProposal(proposal: FeeProposal) {
  return run(
    proposal.address,
    `Execute ${proposal.contractName} fee change #${proposal.id}`,
    (c) => c.methodsObject[proposal.gov.executeEntrypoint](proposal.id),
    'The new fee is now in force.'
  )
}
