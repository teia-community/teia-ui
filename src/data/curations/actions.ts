// Curations contract write layer.
//
//  - any DAO token holder calls create_curation (attaching create_fee)
//  - the owner calls update_curation (attaching edit_fee) / set_curation_hidden
//    / transfer_curation_ownership on their own curation
//  - moderators / multisig users may also edit/hide/transfer any curation for
//    moderation (fee-exempt, no tez attached)
//

import { mutate } from 'swr'
import {
  CURATIONS_CONTRACT,
  CURATION_CREATE_FEE,
  CURATION_EDIT_FEE,
} from '@constants'
import { Tezos, useUserStore } from '@context/userStore'
import { useModalStore } from '@context/modalStore'
import { friendlyError as toFriendlyError } from '@data/contract-errors'
import { buildCurationDocument, uploadCurationContent } from './ipfs'
import type { CurationFeeConfig, CurationLayout, CurationToken } from './types'

/** SWR cache key for the full curations state. */
export const CURATIONS_SWR_KEY = 'curations:all'

function invalidateCurations() {
  mutate(CURATIONS_SWR_KEY)
}

const CURATION_ERRORS = {
  CUR_NOT_AUTHORIZED: 'You are not authorized to perform this action.',
  CUR_NOT_OWNER: 'You are not authorized to perform this action.',
  CUR_NO_TOKENS: 'You must hold Teia (TEIA) tokens to create a curation.',
  CUR_CURATION_NOT_FOUND: 'That curation no longer exists.',
  CUR_INCORRECT_FEE: 'The attached fee does not match the current fee.',
  CUR_PAUSED: 'Curations are temporarily paused by governance.',
  CUR_EMPTY_CID: 'A title is required.',
}

const friendlyError = (e: unknown) => toFriendlyError(e, CURATION_ERRORS)

export interface CurationInput {
  title: string
  description: string
  coverImage?: string
  layout: CurationLayout
  tokens: CurationToken[]
  fee: CurationFeeConfig
  owner: string
}

async function uploadDoc(input: CurationInput): Promise<string> {
  const editor = useUserStore.getState().address ?? ''
  const doc = buildCurationDocument({
    title: input.title,
    description: input.description,
    coverImage: input.coverImage,
    layout: input.layout,
    tokens: input.tokens,
    fee: input.fee,
    owner: input.owner,
    editor,
  })
  return uploadCurationContent(doc)
}

export async function createCuration(input: CurationInput) {
  const { step, show, showError } = useModalStore.getState()
  step('Create Curation', 'Uploading to IPFS', true)
  try {
    const address = useUserStore.getState().address ?? ''
    const cid = await uploadDoc({ ...input, owner: address })
    step('Create Curation', 'Waiting for wallet confirmation', false)
    const contract = await Tezos.wallet.at(CURATIONS_CONTRACT)
    const op = await contract.methodsObject
      .create_curation(cid)
      .send({ amount: CURATION_CREATE_FEE, mutez: true })
    step('Create Curation', 'Awaiting confirmation...')
    await op.confirmation()
    invalidateCurations()
    show('Create Curation', 'Curation created')
    return op.opHash
  } catch (e) {
    const friendly = friendlyError(e)
    showError('Create Curation', friendly)
    throw friendly
  }
}

export async function updateCuration(
  curationId: number,
  input: CurationInput,
  { asModerator = false }: { asModerator?: boolean } = {}
) {
  const { step, show, showError } = useModalStore.getState()
  step('Update Curation', 'Uploading to IPFS', true)
  try {
    const amount = asModerator ? 0 : CURATION_EDIT_FEE
    const cid = await uploadDoc(input)
    step('Update Curation', 'Waiting for wallet confirmation', false)
    const contract = await Tezos.wallet.at(CURATIONS_CONTRACT)
    const op = await contract.methodsObject
      .update_curation({ curation_id: curationId, cid })
      .send({ amount, mutez: true })
    step('Update Curation', 'Awaiting confirmation...')
    await op.confirmation()
    invalidateCurations()
    show('Update Curation', 'Curation updated')
    return op.opHash
  } catch (e) {
    const friendly = friendlyError(e)
    showError('Update Curation', friendly)
    throw friendly
  }
}

export async function setCurationHidden({
  curationId,
  hidden,
}: {
  curationId: number
  hidden: boolean
}) {
  const { step, show, showError } = useModalStore.getState()
  const title = hidden ? 'Hide Curation' : 'Unhide Curation'
  step(title, 'Waiting for wallet', true)
  try {
    const contract = await Tezos.wallet.at(CURATIONS_CONTRACT)
    const op = await contract.methodsObject
      .set_curation_hidden({ curation_id: curationId, hidden })
      .send()
    step(title, 'Awaiting confirmation...')
    await op.confirmation()
    invalidateCurations()
    show(title, hidden ? 'Curation hidden' : 'Curation restored')
    return op.opHash
  } catch (e) {
    const friendly = friendlyError(e)
    showError(title, friendly)
    throw friendly
  }
}

export async function transferCurationOwnership({
  curationId,
  newOwner,
}: {
  curationId: number
  newOwner: string
}) {
  const { step, show, showError } = useModalStore.getState()
  step('Transfer Curation', 'Waiting for wallet', true)
  try {
    const contract = await Tezos.wallet.at(CURATIONS_CONTRACT)
    const op = await contract.methodsObject
      .transfer_curation_ownership({
        curation_id: curationId,
        new_owner: newOwner,
      })
      .send()
    step('Transfer Curation', 'Awaiting confirmation...')
    await op.confirmation()
    invalidateCurations()
    show('Transfer Curation', 'Ownership transferred')
    return op.opHash
  } catch (e) {
    const friendly = friendlyError(e)
    showError('Transfer Curation', friendly)
    throw friendly
  }
}
