// On-chain calendar write layer (mirrors src/data/wiki/actions.ts).
//
// Two access tiers, both enforced on-chain:
//  - moderators / multisig users: create_event, update_event, set_event_hidden,
//    approve_proposal, reject_proposal (direct, no fee)
//  - Teia token holders: propose_event (new) and propose_edit (edit), each
//    attaching the corresponding per-action fee from get_fees (0 by default).

import { mutate } from 'swr'
import { CALENDAR_CONTRACT } from '@constants'
import { Tezos, useUserStore } from '@context/userStore'
import { useModalStore } from '@context/modalStore'
import { buildEventDocument, uploadEventContent } from './ipfs'
import type { EventDocInput } from './ipfs'

/** SWR key for the merged calendar feed (see src/hooks/use-calendar.js). */
export const CALENDAR_SWR_KEY = 'calendar/events'

function invalidate() {
  mutate(CALENDAR_SWR_KEY)
}

function friendlyError(e: unknown): unknown {
  const raw = JSON.stringify(e ?? '')
  if (raw.includes('CAL_NOT_AUTHORIZED')) {
    return new Error('You are not authorized to perform this action.')
  }
  if (raw.includes('CAL_NO_TOKENS')) {
    return new Error('You must hold Teia (TEIA) tokens to submit a proposal.')
  }
  if (raw.includes('CAL_EVENT_NOT_FOUND')) {
    return new Error('That event no longer exists.')
  }
  if (raw.includes('CAL_ALREADY_RESOLVED')) {
    return new Error('This proposal has already been approved or rejected.')
  }
  if (raw.includes('CAL_NO_PROPOSAL')) {
    return new Error('That proposal does not exist.')
  }
  if (raw.includes('CAL_INCORRECT_FEE')) {
    return new Error('The attached fee does not match the current proposal fee.')
  }
  if (raw.includes('CAL_PAUSED')) {
    return new Error('The calendar is temporarily paused by governance.')
  }
  if (raw.includes('CAL_EMPTY_CID')) {
    return new Error('Title and start date are required.')
  }
  return e
}

/** Read the current per-action fees (mutez) from the contract's get_fees view. */
async function getFees(
  viewCaller: string
): Promise<{ proposeEditFee: number; proposeEventFee: number }> {
  try {
    const contract = await Tezos.contract.at(CALENDAR_CONTRACT)
    const fees = await contract.contractViews
      .get_fees()
      .executeView({ viewCaller })
    return {
      proposeEditFee: Number(fees.propose_edit_fee ?? 0),
      proposeEventFee: Number(fees.propose_event_fee ?? 0),
    }
  } catch {
    // View unreachable: assume free (the contract still validates the amount).
    return { proposeEditFee: 0, proposeEventFee: 0 }
  }
}

async function uploadDoc(input: EventDocInput): Promise<string> {
  const author = useUserStore.getState().address ?? ''
  const doc = buildEventDocument(input, author)
  return uploadEventContent(doc)
}

// --- Moderator / multisig actions (no fee) ---

export async function createEvent(input: EventDocInput) {
  const { step, show, showError } = useModalStore.getState()
  step('Create Event', 'Uploading to IPFS', true)
  try {
    const cid = await uploadDoc(input)
    step('Create Event', 'Waiting for wallet confirmation', false)
    const contract = await Tezos.wallet.at(CALENDAR_CONTRACT)
    const op = await contract.methodsObject.create_event(cid).send()
    step('Create Event', 'Awaiting confirmation...')
    await op.confirmation()
    invalidate()
    show('Create Event', 'Event created')
    return op.opHash
  } catch (e) {
    const friendly = friendlyError(e)
    showError('Create Event', friendly)
    throw friendly
  }
}

export async function updateEvent(eventId: number, input: EventDocInput) {
  const { step, show, showError } = useModalStore.getState()
  step('Update Event', 'Uploading to IPFS', true)
  try {
    const cid = await uploadDoc(input)
    step('Update Event', 'Waiting for wallet confirmation', false)
    const contract = await Tezos.wallet.at(CALENDAR_CONTRACT)
    const op = await contract.methodsObject
      .update_event({ event_id: eventId, cid })
      .send()
    step('Update Event', 'Awaiting confirmation...')
    await op.confirmation()
    invalidate()
    show('Update Event', 'Event updated')
    return op.opHash
  } catch (e) {
    const friendly = friendlyError(e)
    showError('Update Event', friendly)
    throw friendly
  }
}

export async function setEventHidden({
  eventId,
  hidden,
}: {
  eventId: number
  hidden: boolean
}) {
  const { step, show, showError } = useModalStore.getState()
  const title = hidden ? 'Hide Event' : 'Unhide Event'
  step(title, 'Waiting for wallet', true)
  try {
    const contract = await Tezos.wallet.at(CALENDAR_CONTRACT)
    const op = await contract.methodsObject
      .set_event_hidden({ event_id: eventId, hidden })
      .send()
    step(title, 'Awaiting confirmation...')
    await op.confirmation()
    invalidate()
    show(title, hidden ? 'Event hidden' : 'Event restored')
    return op.opHash
  } catch (e) {
    const friendly = friendlyError(e)
    showError(title, friendly)
    throw friendly
  }
}

export async function approveProposal(proposalId: string) {
  const { step, show, showError } = useModalStore.getState()
  step('Approve Proposal', 'Waiting for wallet', true)
  try {
    const contract = await Tezos.wallet.at(CALENDAR_CONTRACT)
    const op = await contract.methodsObject
      .approve_proposal(Number(proposalId))
      .send()
    step('Approve Proposal', 'Awaiting confirmation...')
    await op.confirmation()
    invalidate()
    show('Approve Proposal', 'Proposal approved and applied')
    return op.opHash
  } catch (e) {
    const friendly = friendlyError(e)
    showError('Approve Proposal', friendly)
    throw friendly
  }
}

export async function rejectProposal(proposalId: string) {
  const { step, show, showError } = useModalStore.getState()
  step('Reject Proposal', 'Waiting for wallet', true)
  try {
    const contract = await Tezos.wallet.at(CALENDAR_CONTRACT)
    const op = await contract.methodsObject
      .reject_proposal(Number(proposalId))
      .send()
    step('Reject Proposal', 'Awaiting confirmation...')
    await op.confirmation()
    invalidate()
    show('Reject Proposal', 'Proposal rejected')
    return op.opHash
  } catch (e) {
    const friendly = friendlyError(e)
    showError('Reject Proposal', friendly)
    throw friendly
  }
}

// --- Community proposals (token-gated, fee-bearing) ---

export async function proposeEvent(input: EventDocInput) {
  const { step, show, showError } = useModalStore.getState()
  step('Propose Event', 'Uploading to IPFS', true)
  try {
    const address = useUserStore.getState().address ?? ''
    const cid = await uploadDoc(input)
    const { proposeEventFee } = await getFees(address)
    step('Propose Event', 'Waiting for wallet confirmation', false)
    const contract = await Tezos.wallet.at(CALENDAR_CONTRACT)
    const op = await contract.methodsObject
      .propose_event(cid)
      .send({ amount: proposeEventFee, mutez: true })
    step('Propose Event', 'Awaiting confirmation...')
    await op.confirmation()
    invalidate()
    show('Propose Event', 'Your event was submitted for moderator review.')
    return op.opHash
  } catch (e) {
    const friendly = friendlyError(e)
    showError('Propose Event', friendly)
    throw friendly
  }
}

export async function proposeEdit(eventId: number, input: EventDocInput) {
  const { step, show, showError } = useModalStore.getState()
  step('Propose Edit', 'Uploading to IPFS', true)
  try {
    const address = useUserStore.getState().address ?? ''
    const cid = await uploadDoc(input)
    const { proposeEditFee } = await getFees(address)
    step('Propose Edit', 'Waiting for wallet confirmation', false)
    const contract = await Tezos.wallet.at(CALENDAR_CONTRACT)
    const op = await contract.methodsObject
      .propose_edit({ event_id: eventId, proposed_cid: cid })
      .send({ amount: proposeEditFee, mutez: true })
    step('Propose Edit', 'Awaiting confirmation...')
    await op.confirmation()
    invalidate()
    show('Propose Edit', 'Your edit was submitted for moderator review.')
    return op.opHash
  } catch (e) {
    const friendly = friendlyError(e)
    showError('Propose Edit', friendly)
    throw friendly
  }
}
