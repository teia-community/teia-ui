// Writes against the core team multisig.
//
// Every one of these is a signed transaction from a core team member. The
// contract decides who may do what: a non-member's vote is rejected on-chain,
// so the interface hides the controls but the contract is what enforces it.

import { mutate } from 'swr'
import { stringToBytes } from '@taquito/utils'
import { Tezos } from '@context/userStore'
import { useModalStore } from '@context/modalStore'
import { DAO_TREASURY_CONTRACT } from '@constants'

/** Anything the multisig reads is stale once a write lands. */
async function invalidate() {
  await mutate('multisig:state')
}

function friendlyError(e: unknown): string {
  const message =
    (e as { message?: string })?.message ?? (typeof e === 'string' ? e : '')
  if (/aborted|rejected|UserAbortedError/i.test(message)) {
    return 'Cancelled in the wallet.'
  }
  if (/not a user|NOT_USER|only user/i.test(message)) {
    return 'Only core team members can do this.'
  }
  if (/already voted|ALREADY_VOTED/i.test(message)) {
    return 'You have already voted on this proposal.'
  }
  if (/expired|EXPIRED/i.test(message)) {
    return 'This proposal has expired and can no longer be acted on.'
  }
  if (/not enough|MIN_VOTES|minimum/i.test(message)) {
    return 'This proposal does not have enough votes yet.'
  }
  return message || 'The transaction failed.'
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Method = { send: (params?: any) => Promise<any> }

async function run(
  title: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  build: (c: any) => Method,
  successMessage: string
): Promise<string | undefined> {
  const { step, show, showError } = useModalStore.getState()
  step(title, 'Waiting for wallet confirmation', true)
  try {
    const contract = await Tezos.wallet.at(DAO_TREASURY_CONTRACT)
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

/** Vote for or against an open proposal. */
export function voteProposal(proposalId: string, approval: boolean) {
  return run(
    `Vote on proposal #${proposalId}`,
    (c) =>
      c.methodsObject.vote_proposal({
        proposal_id: Number(proposalId),
        approval,
      }),
    approval ? 'Voted in favour.' : 'Voted against.'
  )
}

/** Carry out a proposal that has reached the votes it needs. */
export function executeProposal(proposalId: string) {
  return run(
    `Execute proposal #${proposalId}`,
    (c) => c.methodsObject.execute_proposal(Number(proposalId)),
    'Proposal executed.'
  )
}

/**
 * Put a written proposal to the core team. The contract stores the link as
 * bytes, which is how the multisig interface has always written it.
 */
export function proposeText(ipfsUri: string) {
  return run(
    'New text proposal',
    (c) => c.methodsObject.text_proposal(stringToBytes(ipfsUri)),
    'Proposal submitted. It now needs votes from the core team.'
  )
}

export interface Distribution {
  /** Already in the smallest unit the token or tez uses. */
  amount: number
  destination: string
}

/** Propose sending tez from the treasury. */
export function proposeTezTransfer(distribution: Distribution[]) {
  return run(
    'New tez transfer proposal',
    (c) =>
      c.methodsObject.transfer_mutez_proposal(
        distribution.map((d) => ({
          amount: d.amount,
          destination: d.destination,
        }))
      ),
    'Proposal submitted. It now needs votes from the core team.'
  )
}

/**
 * Propose sending a token -- USDt and the other stablecoins the treasury
 * holds. Amounts arrive in the token's smallest unit, converted from what
 * someone typed before they get here.
 */
export function proposeTokenTransfer(
  fa2: string,
  tokenId: string,
  distribution: Distribution[]
) {
  return run(
    'New token transfer proposal',
    (c) =>
      c.methodsObject.transfer_token_proposal({
        fa2,
        token_id: Number(tokenId),
        distribution: distribution.map((d) => ({
          amount: d.amount,
          destination: d.destination,
        })),
      }),
    'Proposal submitted. It now needs votes from the core team.'
  )
}

/** Propose adding someone to the core team. */
export function proposeAddUser(address: string) {
  return run(
    'New member proposal',
    (c) => c.methodsObject.add_user_proposal(address),
    'Proposal submitted. It now needs votes from the core team.'
  )
}

/** Propose removing someone from the core team. */
export function proposeRemoveUser(address: string) {
  return run(
    'Remove member proposal',
    (c) => c.methodsObject.remove_user_proposal(address),
    'Proposal submitted. It now needs votes from the core team.'
  )
}

/** Propose changing how many votes in favour a proposal needs. */
export function proposeMinimumVotes(votes: number) {
  return run(
    'Minimum votes proposal',
    (c) => c.methodsObject.minimum_votes_proposal(votes),
    'Proposal submitted. It now needs votes from the core team.'
  )
}

/** Propose changing how long a proposal stays open, in days. */
export function proposeExpirationTime(days: number) {
  return run(
    'Expiration time proposal',
    (c) => c.methodsObject.expiration_time_proposal(days),
    'Proposal submitted. It now needs votes from the core team.'
  )
}
