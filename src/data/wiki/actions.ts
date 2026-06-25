// Wiki contract write layer.
//
// Two access tiers, both enforced on-chain:
//  - moderators / multisig users: create_page, update_page, set_page_hidden,
//    approve_proposal, reject_proposal (direct edits, no fee)
//  - Teia token holders: create_proposal (edit) and prop_new_page (new page),
//    each attaching the corresponding per-action fee (0 by default).
//

import { mutate } from 'swr'
import {
  WIKI_CONTRACT,
  DAO_TOKEN_CONTRACT,
  WIKI_TOKEN_ID,
} from '@constants'
import { Tezos, useUserStore } from '@context/userStore'
import { useModalStore } from '@context/modalStore'
import { buildPageDocument, uploadPageContent } from './ipfs'

/** SWR cache key for the full wiki state (pages + proposals). */
export const WIKI_SWR_KEY = 'wiki:all'

function invalidateWiki() {
  mutate(WIKI_SWR_KEY)
}

function friendlyError(e: unknown): unknown {
  const raw = JSON.stringify(e ?? '')
  if (raw.includes('WIKI_NOT_AUTHORIZED')) {
    return new Error('You are not authorized to perform this action.')
  }
  if (raw.includes('WIKI_NO_TOKENS')) {
    return new Error('You must hold Teia (TEIA) tokens to submit a proposal.')
  }
  if (raw.includes('WIKI_PAGE_NOT_FOUND')) {
    return new Error('That page no longer exists.')
  }
  if (raw.includes('WIKI_ALREADY_RESOLVED')) {
    return new Error('This proposal has already been approved or rejected.')
  }
  if (raw.includes('WIKI_NO_PROPOSAL')) {
    return new Error('That proposal does not exist.')
  }
  if (raw.includes('WIKI_INCORRECT_FEE')) {
    return new Error(
      'The attached fee does not match the current proposal fee.'
    )
  }
  if (raw.includes('WIKI_PAUSED')) {
    return new Error('The wiki is temporarily paused by governance.')
  }
  if (raw.includes('WIKI_EMPTY_CID')) {
    return new Error('Title and content are required.')
  }
  return e
}

interface PageInput {
  title: string
  slug: string
  parent: string | null
  content: string
  summary?: string
}

/** Read the current per-action fees (mutez) from the contract's get_fees view. */
async function getFees(
  viewCaller: string
): Promise<{ proposeEditFee: number; proposePageFee: number }> {
  try {
    const contract = await Tezos.contract.at(WIKI_CONTRACT)
    const fees = await contract.contractViews
      .get_fees()
      .executeView({ viewCaller })
    return {
      proposeEditFee: Number(fees.propose_edit_fee ?? 0),
      proposePageFee: Number(fees.propose_page_fee ?? 0),
    }
  } catch {
    // View unreachable: assume free (the contract still validates the amount).
    return { proposeEditFee: 0, proposePageFee: 0 }
  }
}

async function uploadDoc(input: PageInput): Promise<string> {
  const author = useUserStore.getState().address ?? ''
  const doc = buildPageDocument({ ...input, author })
  return uploadPageContent(doc)
}

// --- Moderator / multisig actions (no fee) ---

export async function createPage(input: PageInput) {
  const { step, show, showError } = useModalStore.getState()
  step('Create Page', 'Uploading to IPFS', true)
  try {
    const cid = await uploadDoc(input)
    step('Create Page', 'Waiting for wallet confirmation', false)
    const contract = await Tezos.wallet.at(WIKI_CONTRACT)
    const op = await contract.methodsObject.create_page(cid).send()
    step('Create Page', 'Awaiting confirmation...')
    await op.confirmation()
    invalidateWiki()
    show('Create Page', 'Page created')
    return op.opHash
  } catch (e) {
    const friendly = friendlyError(e)
    showError('Create Page', friendly)
    throw friendly
  }
}

export async function updatePage(pageId: number, input: PageInput) {
  const { step, show, showError } = useModalStore.getState()
  step('Update Page', 'Uploading to IPFS', true)
  try {
    const cid = await uploadDoc(input)
    step('Update Page', 'Waiting for wallet confirmation', false)
    const contract = await Tezos.wallet.at(WIKI_CONTRACT)
    const op = await contract.methodsObject
      .update_page({ page_id: pageId, cid })
      .send()
    step('Update Page', 'Awaiting confirmation...')
    await op.confirmation()
    invalidateWiki()
    show('Update Page', 'Page updated')
    return op.opHash
  } catch (e) {
    const friendly = friendlyError(e)
    showError('Update Page', friendly)
    throw friendly
  }
}

export async function setPageHidden({
  pageId,
  hidden,
}: {
  pageId: number
  hidden: boolean
}) {
  const { step, show, showError } = useModalStore.getState()
  const title = hidden ? 'Hide Page' : 'Unhide Page'
  step(title, 'Waiting for wallet', true)
  try {
    const contract = await Tezos.wallet.at(WIKI_CONTRACT)
    const op = await contract.methodsObject
      .set_page_hidden({ page_id: pageId, hidden })
      .send()
    step(title, 'Awaiting confirmation...')
    await op.confirmation()
    invalidateWiki()
    show(title, hidden ? 'Page hidden' : 'Page restored')
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
    const contract = await Tezos.wallet.at(WIKI_CONTRACT)
    const op = await contract.methodsObject
      .approve_proposal(Number(proposalId))
      .send()
    step('Approve Proposal', 'Awaiting confirmation...')
    await op.confirmation()
    invalidateWiki()
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
    const contract = await Tezos.wallet.at(WIKI_CONTRACT)
    const op = await contract.methodsObject
      .reject_proposal(Number(proposalId))
      .send()
    step('Reject Proposal', 'Awaiting confirmation...')
    await op.confirmation()
    invalidateWiki()
    show('Reject Proposal', 'Proposal rejected')
    return op.opHash
  } catch (e) {
    const friendly = friendlyError(e)
    showError('Reject Proposal', friendly)
    throw friendly
  }
}

// --- Community proposals (token-gated, fee-bearing) ---

export async function createEditProposal(pageId: number, input: PageInput) {
  const { step, show, showError } = useModalStore.getState()
  step('Propose Edit', 'Uploading to IPFS', true)
  try {
    const address = useUserStore.getState().address ?? ''
    const cid = await uploadDoc(input)
    const { proposeEditFee } = await getFees(address)
    step('Propose Edit', 'Waiting for wallet confirmation', false)
    const contract = await Tezos.wallet.at(WIKI_CONTRACT)
    const op = await contract.methodsObject
      .create_proposal({ page_id: pageId, proposed_cid: cid })
      .send({ amount: proposeEditFee, mutez: true })
    step('Propose Edit', 'Awaiting confirmation...')
    await op.confirmation()
    invalidateWiki()
    show('Propose Edit', 'Your edit was submitted for moderator review.')
    return op.opHash
  } catch (e) {
    const friendly = friendlyError(e)
    showError('Propose Edit', friendly)
    throw friendly
  }
}

export async function proposeNewPage(input: PageInput) {
  const { step, show, showError } = useModalStore.getState()
  step('Propose Page', 'Uploading to IPFS', true)
  try {
    const address = useUserStore.getState().address ?? ''
    const cid = await uploadDoc(input)
    const { proposePageFee } = await getFees(address)
    step('Propose Page', 'Waiting for wallet confirmation', false)
    const contract = await Tezos.wallet.at(WIKI_CONTRACT)
    const op = await contract.methodsObject
      .prop_new_page(cid)
      .send({ amount: proposePageFee, mutez: true })
    step('Propose Page', 'Awaiting confirmation...')
    await op.confirmation()
    invalidateWiki()
    show('Propose Page', 'Your new page was submitted for moderator review.')
    return op.opHash
  } catch (e) {
    const friendly = friendlyError(e)
    showError('Propose Page', friendly)
    throw friendly
  }
}

// Re-exported so the token gate constants live in one place for callers.
export { DAO_TOKEN_CONTRACT, WIKI_TOKEN_ID }
