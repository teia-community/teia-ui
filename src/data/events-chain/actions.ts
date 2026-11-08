// On-chain events registry write layer
// (mirrors src/data/calendar-chain/actions.ts).
//
// Two access tiers, both enforced on-chain:
//  - moderators / multisig users: create_event, update_event,
//    set_event_hidden, approve_proposal, reject_proposal (direct, no fee)
//  - Teia token holders: propose_event, attaching propose_fee from get_fees
//    (0 by default).

import { mutate } from 'swr'
import { EVENTS_CONTRACT } from '@constants'
import { Tezos, useUserStore } from '@context/userStore'
import { useModalStore } from '@context/modalStore'
import { buildEventDocument, uploadEventContent } from './ipfs'
import type { EventDocInput } from './ipfs'

/** SWR keys for the events registry (see ./hooks.ts). */
export const EVENTS_SWR_KEY = 'events-chain/events'
export const EVENTS_MOD_SWR_KEY = 'events-chain/mod-events'
export const EVENT_PROPOSALS_SWR_KEY = 'events-chain/proposals'

function invalidate() {
  mutate(EVENTS_SWR_KEY)
  mutate(EVENTS_MOD_SWR_KEY)
  mutate(EVENT_PROPOSALS_SWR_KEY)
}

const ERRORS: Record<string, string> = {
  EVT_NOT_AUTHORIZED: 'You are not authorized to perform this action.',
  EVT_NO_TOKENS: 'You must hold Teia (TEIA) tokens to submit a proposal.',
  EVT_EVENT_NOT_FOUND: 'That event no longer exists.',
  EVT_ALREADY_RESOLVED: 'This proposal has already been approved or rejected.',
  EVT_NO_PROPOSAL: 'That proposal does not exist.',
  EVT_INCORRECT_FEE:
    'The attached fee does not match the current proposal fee.',
  EVT_PAUSED: 'Events are temporarily paused by governance.',
  EVT_EMPTY_CID: 'A title and a link are required.',
}

function friendlyError(e: unknown): unknown {
  const raw = JSON.stringify(e ?? '') + String((e as Error)?.message ?? '')
  const code = Object.keys(ERRORS).find((c) => raw.includes(c))
  return code ? new Error(ERRORS[code]) : e
}

/** Read the current proposal fee (mutez) from the contract's get_fees view. */
async function getProposeFee(viewCaller: string): Promise<number> {
  try {
    const contract = await Tezos.contract.at(EVENTS_CONTRACT)
    const fees = await contract.contractViews
      .get_fees()
      .executeView({ viewCaller })
    return Number(fees.propose_fee ?? 0)
  } catch {
    // View unreachable: assume free (the contract still validates the amount).
    return 0
  }
}

async function uploadDoc(input: EventDocInput): Promise<string> {
  const author = useUserStore.getState().address ?? ''
  return uploadEventContent(buildEventDocument(input, author))
}

/**
 * Shared modal + confirmation flow for every entrypoint call. `prepare` runs
 * the off-chain part (IPFS upload, fee lookup) and returns the entrypoint
 * argument and the tez to attach.
 */
async function send(
  title: string,
  done: string,
  entrypoint: string,
  prepare: () => Promise<{ arg: unknown; amount?: number }>,
  uploads = false
) {
  const { step, show, showError } = useModalStore.getState()
  step(title, uploads ? 'Uploading to IPFS' : 'Waiting for wallet', true)
  try {
    const { arg, amount = 0 } = await prepare()
    if (uploads) step(title, 'Waiting for wallet confirmation', false)
    const contract = await Tezos.wallet.at(EVENTS_CONTRACT)
    const op = await contract.methodsObject[entrypoint](arg).send({
      amount,
      mutez: true,
    })
    step(title, 'Awaiting confirmation...')
    await op.confirmation()
    invalidate()
    show(title, done)
    return op.opHash
  } catch (e) {
    const friendly = friendlyError(e)
    showError(title, friendly)
    throw friendly
  }
}

// --- Moderator / multisig actions (no fee) ---

export function createEvent(input: EventDocInput) {
  return send(
    'Create Event',
    'Event created',
    'create_event',
    async () => ({ arg: await uploadDoc(input) }),
    true
  )
}

export function updateEvent(eventId: number, input: EventDocInput) {
  return send(
    'Update Event',
    'Event updated',
    'update_event',
    async () => ({ arg: { event_id: eventId, cid: await uploadDoc(input) } }),
    true
  )
}

export function setEventHidden({
  eventId,
  hidden,
}: {
  eventId: number
  hidden: boolean
}) {
  return send(
    hidden ? 'Hide Event' : 'Unhide Event',
    hidden ? 'Event hidden' : 'Event restored',
    'set_event_hidden',
    async () => ({ arg: { event_id: eventId, hidden } })
  )
}

export function approveEventProposal(proposalId: string) {
  return send(
    'Approve Proposal',
    'Proposal approved and the event added',
    'approve_proposal',
    async () => ({ arg: Number(proposalId) })
  )
}

export function rejectEventProposal(proposalId: string) {
  return send(
    'Reject Proposal',
    'Proposal rejected',
    'reject_proposal',
    async () => ({ arg: Number(proposalId) })
  )
}

// --- Community proposals (token-gated, fee-bearing) ---

export function proposeEvent(input: EventDocInput) {
  return send(
    'Propose Event',
    'Your event was submitted for moderator review.',
    'propose_event',
    async () => {
      const address = useUserStore.getState().address ?? ''
      const arg = await uploadDoc(input)
      return { arg, amount: await getProposeFee(address) }
    },
    true
  )
}
