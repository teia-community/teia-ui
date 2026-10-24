// Curations write layer.
//
//  - only the owner can edit or hide
//  - moderators / multisig users can toggle `moderated`
//
// After a write we can't match SWR keys by predicate (swr ^1.3), so we seed the
// immutable doc under its CID key and revalidate the exact keys we can compute.

import { mutate } from 'swr'
import { OpKind } from '@taquito/taquito'
import {
  CURATIONS_CONTRACT,
  CURATION_CREATE_FEE,
  CURATION_EDIT_FEE,
} from '@constants'
import { Tezos, useUserStore } from '@context/userStore'
import { getContractFee } from '@data/contract-fees'
import { useModalStore } from '@context/modalStore'
import { buildCurationDocument, uploadCurationContent } from './ipfs'
import type {
  ChannelRef,
  CurationContent,
  CurationFeeConfig,
  CurationLayout,
  CurationToken,
  EventRef,
} from './types'

const feeLabel = (mutez: number) => `${mutez / 1_000_000} ꜩ`

function friendlyError(e: unknown): unknown {
  const raw = JSON.stringify(e ?? '')
  if (raw.includes('CUR_NOT_OWNER')) {
    return new Error('Only the owner can edit or hide this curation.')
  }
  if (raw.includes('CUR_NOT_AUTHORIZED')) {
    return new Error('Only Teia moderators can do that.')
  }
  if (raw.includes('CUR_NO_TOKENS')) {
    return new Error('You must hold Teia (TEIA) tokens to create a curation.')
  }
  if (raw.includes('CUR_CURATION_NOT_FOUND')) {
    return new Error('That curation no longer exists.')
  }
  if (raw.includes('CUR_INCORRECT_FEE')) {
    return new Error(
      'The curation fee has changed — please reload the page. If this persists, Teia needs to update the app.'
    )
  }
  if (raw.includes('CUR_PAUSED')) {
    return new Error('Curations are temporarily paused by governance.')
  }
  if (raw.includes('CUR_EMPTY_CID')) {
    return new Error('A title is required.')
  }
  if (raw.includes('CUR_TEZ_TRANSFER')) {
    return new Error('This action must not include a tez amount.')
  }
  return e
}

export interface CurationInput {
  title: string
  description: string
  coverImage?: string
  coverThumbnail?: string
  layout: CurationLayout
  tokens: CurationToken[]
  tags: string[]
  channels: ChannelRef[]
  events: EventRef[]
  fee: CurationFeeConfig
  owner: string
}

async function buildAndUpload(
  input: CurationInput
): Promise<{ cid: string; doc: CurationContent }> {
  const editor = useUserStore.getState().address ?? ''
  const doc = buildCurationDocument({
    title: input.title,
    description: input.description,
    coverImage: input.coverImage,
    coverThumbnail: input.coverThumbnail,
    layout: input.layout,
    tokens: input.tokens,
    tags: input.tags,
    channels: input.channels,
    events: input.events,
    fee: input.fee,
    owner: input.owner,
    editor,
  })
  const cid = await uploadCurationContent(doc)
  return { cid, doc }
}

/** Seed the new doc + revalidate the list. */
function invalidateAfterWrite(
  cid: string,
  doc: CurationContent,
  owner: string,
  id?: number
) {
  mutate(`curations:content:${cid}`, doc, false)
  mutate('curations:page:desc:0')
  mutate('curations:page:asc:0')
  mutate(['curations:all', 'desc'])
  mutate(['curations:all', 'asc'])
  mutate(['curations:owner', owner, true])
  mutate(['curations:owner', owner, false])
  if (id != null) mutate(['curations:one', id])
}

export async function createCuration(input: CurationInput) {
  const { step, show, showError } = useModalStore.getState()
  step('Create Curation', 'Uploading to IPFS', true)
  try {
    const address = useUserStore.getState().address ?? ''
    const { cid, doc } = await buildAndUpload({ ...input, owner: address })
    const createFee = await getContractFee(
      CURATIONS_CONTRACT,
      'create_fee',
      CURATION_CREATE_FEE
    )
    step(
      'Create Curation',
      `Waiting for wallet confirmation (${feeLabel(createFee)} fee)`,
      false
    )
    const contract = await Tezos.wallet.at(CURATIONS_CONTRACT)
    const op = await contract.methodsObject
      .create_curation(cid)
      .send({ amount: createFee, mutez: true })
    step('Create Curation', 'Awaiting confirmation...')
    await op.confirmation()
    invalidateAfterWrite(cid, doc, address)
    show('Create Curation', 'Curation created')
    return op.opHash
  } catch (e) {
    const friendly = friendlyError(e)
    showError('Create Curation', friendly)
    throw friendly
  }
}

export async function updateCuration(curationId: number, input: CurationInput) {
  const { step, show, showError } = useModalStore.getState()
  step('Update Curation', 'Uploading to IPFS', true)
  try {
    const { cid, doc } = await buildAndUpload(input)
    const editFee = await getContractFee(
      CURATIONS_CONTRACT,
      'edit_fee',
      CURATION_EDIT_FEE
    )
    step(
      'Update Curation',
      `Waiting for wallet confirmation (${feeLabel(editFee)} fee)`,
      false
    )
    const contract = await Tezos.wallet.at(CURATIONS_CONTRACT)
    const op = await contract.methodsObject
      .update_curation({ curation_id: curationId, cid })
      .send({ amount: editFee, mutez: true })
    step('Update Curation', 'Awaiting confirmation...')
    await op.confirmation()
    invalidateAfterWrite(cid, doc, input.owner, curationId)
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
    mutate(['curations:one', curationId])
    mutate('curations:page:desc:0')
    mutate('curations:page:asc:0')
    mutate(['curations:all', 'desc'])
    mutate(['curations:all', 'asc'])
    show(title, hidden ? 'Curation hidden' : 'Curation restored')
    return op.opHash
  } catch (e) {
    const friendly = friendlyError(e)
    showError(title, friendly)
    throw friendly
  }
}

/** Moderators / multisig users only. No fee. */
export async function setCurationModerated({
  curationId,
  moderated,
}: {
  curationId: number
  moderated: boolean
}) {
  const { step, show, showError } = useModalStore.getState()
  const title = moderated ? 'Moderate Curation' : 'Unmoderate Curation'
  step(title, 'Waiting for wallet', true)
  try {
    const contract = await Tezos.wallet.at(CURATIONS_CONTRACT)
    const op = await contract.methodsObject
      .set_curation_moderated({ curation_id: curationId, moderated })
      .send()
    step(title, 'Awaiting confirmation...')
    await op.confirmation()
    mutate(['curations:one', curationId])
    mutate('curations:page:desc:0')
    mutate('curations:page:asc:0')
    mutate(['curations:all', 'desc'])
    mutate(['curations:all', 'asc'])
    mutate('curations:admin')
    show(title, moderated ? 'Curation moderated' : 'Curation restored')
    return op.opHash
  } catch (e) {
    const friendly = friendlyError(e)
    showError(title, friendly)
    throw friendly
  }
}

/**
 * Used for the migration, will be removed before merging to main.
 */
export async function migrateCurations(cids: string[]) {
  const { step, show, showError } = useModalStore.getState()
  const title = 'Migrate Curations'
  step(title, 'Reading the current fee', true)
  try {
    const createFee = await getContractFee(
      CURATIONS_CONTRACT,
      'create_fee',
      CURATION_CREATE_FEE
    )
    const total = createFee * cids.length
    step(
      title,
      `Waiting for wallet confirmation (${feeLabel(total)} total)`,
      true
    )
    const address = useUserStore.getState().address ?? ''
    const contract = await Tezos.wallet.at(CURATIONS_CONTRACT)
    const op = await Tezos.wallet
      .batch(
        cids.map((cid) => ({
          kind: OpKind.TRANSACTION as const,
          ...contract.methodsObject
            .create_curation(cid)
            .toTransferParams({ amount: createFee, mutez: true }),
        }))
      )
      .send()
    step(title, 'Awaiting confirmation...')
    await op.confirmation()
    mutate('curations:page:desc:0')
    mutate('curations:page:asc:0')
    mutate(['curations:owner', address, true])
    mutate(['curations:owner', address, false])
    mutate(['curations:v3-migration', address])
    show(
      title,
      `${cids.length} curation${cids.length === 1 ? '' : 's'} migrated`
    )
    return op.opHash
  } catch (e) {
    const friendly = friendlyError(e)
    showError(title, friendly)
    throw friendly
  }
}
