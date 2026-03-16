/**
 * DM Contract Actions
 */
import { stringToBytes } from '@taquito/utils'
import { SHADOWNET_DM_CONTRACT } from '@constants'
import { ShadownetTezos, useShadownetStore } from '@context/shadownetStore'
import { useModalStore } from '@context/modalStore'
import { uploadFileToIPFSProxy } from '../ipfs'
import type { ConversationMetadata, DmMessagePayload } from './dm-types'

const CONTRACT = SHADOWNET_DM_CONTRACT

/**
 * Redundant code used for testing, needs to be updated to use common upload function
 */
async function uploadJsonToIPFS(
  data: Record<string, unknown>
): Promise<string> {
  const blob = new Blob([JSON.stringify(data)], { type: 'application/json' })
  const file = new File([blob], 'metadata.json', { type: 'application/json' })
  const cid = await uploadFileToIPFSProxy(
    { blob: file, path: file.name, size: file.size },
    'DM'
  )
  if (!cid) throw new Error('IPFS upload failed')
  return `ipfs://${cid}`
}

function getAddress() {
  return useShadownetStore.getState().address
}

/**
 * Create a conversation with initial participants
 */
export async function createConversation({
  name,
  description,
  participants,
  conversationFee,
}: {
  name: string
  description: string
  participants: string[]
  conversationFee: number
}) {
  const step = useModalStore.getState().step
  const show = useModalStore.getState().show
  const showError = useModalStore.getState().showError

  step('Create Conversation', 'Uploading metadata to IPFS', true)

  try {
    const metadata: ConversationMetadata = {
      type: 'teia-dm',
      version: 1,
      name: name.trim(),
      description: description.trim(),
    }

    const metadataIpfsUri = await uploadJsonToIPFS(
      metadata as unknown as Record<string, unknown>
    )
    const metadataBytes = stringToBytes(metadataIpfsUri)

    step('Create Conversation', 'Waiting for wallet', false)

    const contract = await ShadownetTezos.wallet.at(CONTRACT)
    const op = await contract.methodsObject
      .create_conversation({
        metadata_uri: metadataBytes,
        participants,
      })
      .send({ amount: conversationFee, mutez: true })

    step(
      'Create Conversation',
      `Awaiting confirmation of [operation](https://shadownet.tzkt.io/${op.opHash})`
    )
    await op.confirmation()
    show('Create Conversation', 'Conversation created')
    return op.opHash
  } catch (e) {
    showError('Create Conversation', e)
    throw e
  }
}

/**
 * Post a message to a conversation
 */
export async function postDmMessage({
  conversationId,
  content,
  messageFee,
  parentId,
  storageMode = 'onchain',
  embeds,
}: {
  conversationId: number
  content: string
  messageFee: number
  parentId?: number
  storageMode?: 'onchain' | 'ipfs'
  embeds?: unknown[]
}) {
  const step = useModalStore.getState().step
  const show = useModalStore.getState().show
  const showError = useModalStore.getState().showError
  const author = getAddress()

  step('Post Message', 'Preparing', true)

  try {
    const payload: DmMessagePayload = {
      type: 'teia-dm-message',
      version: 1,
      content,
      author: author || '',
      timestamp: new Date().toISOString(),
    }
    if (parentId !== undefined) payload.parentId = parentId
    if (embeds?.length) payload.embeds = embeds

    let contentBytes: string
    if (storageMode === 'ipfs') {
      step('Post Message', 'Uploading to IPFS', true)
      const ipfsUri = await uploadJsonToIPFS(
        payload as unknown as Record<string, unknown>
      )
      contentBytes = stringToBytes(ipfsUri)
    } else {
      contentBytes = stringToBytes(JSON.stringify(payload))
    }

    const contract = await ShadownetTezos.wallet.at(CONTRACT)
    const op = await contract.methodsObject
      .post_message({
        conversation_id: conversationId,
        content: contentBytes,
        parent_id: parentId !== undefined ? parentId : null,
      })
      .send({ amount: messageFee, mutez: true })

    step(
      'Post Message',
      `Awaiting confirmation of [operation](https://shadownet.tzkt.io/${op.opHash})`
    )
    await op.confirmation()
    show('Post Message', 'Message sent')
    return op.opHash
  } catch (e) {
    showError('Post Message', e)
    throw e
  }
}

/**
 * Delete a message
 */
export async function deleteDmMessage(messageId: number) {
  const step = useModalStore.getState().step
  const show = useModalStore.getState().show
  const showError = useModalStore.getState().showError

  step('Delete Message', 'Waiting for wallet', true)

  try {
    const contract = await ShadownetTezos.wallet.at(CONTRACT)
    const op = await contract.methodsObject.delete_message(messageId).send()

    step(
      'Delete Message',
      `Awaiting confirmation of [operation](https://shadownet.tzkt.io/${op.opHash})`
    )
    await op.confirmation()
    show('Delete Message', 'Message deleted')
    return op.opHash
  } catch (e) {
    showError('Delete Message', e)
    throw e
  }
}

/**
 * Add or remove participants
 */
export async function updateParticipants({
  conversationId,
  toAdd,
  toRemove,
}: {
  conversationId: number
  toAdd: string[]
  toRemove: string[]
}) {
  const step = useModalStore.getState().step
  const show = useModalStore.getState().show
  const showError = useModalStore.getState().showError

  step('Update Participants', 'Waiting for wallet', true)

  try {
    const contract = await ShadownetTezos.wallet.at(CONTRACT)
    const op = await contract.methodsObject
      .update_participants({
        conversation_id: conversationId,
        to_add: toAdd,
        to_remove: toRemove,
      })
      .send()

    await op.confirmation()
    show('Update Participants', 'Participants updated')
    return op.opHash
  } catch (e) {
    showError('Update Participants', e)
    throw e
  }
}

/**
 * Add or remove conversation admins. Creator only
 */
export async function updateDmAdmins({
  conversationId,
  toAdd,
  toRemove,
}: {
  conversationId: number
  toAdd: string[]
  toRemove: string[]
}) {
  const step = useModalStore.getState().step
  const show = useModalStore.getState().show
  const showError = useModalStore.getState().showError

  step('Update Admins', 'Waiting for wallet', true)

  try {
    const contract = await ShadownetTezos.wallet.at(CONTRACT)
    const op = await contract.methodsObject
      .update_conversation_admins({
        conversation_id: conversationId,
        to_add: toAdd,
        to_remove: toRemove,
      })
      .send()

    await op.confirmation()
    show('Update Admins', 'Admins updated')
    return op.opHash
  } catch (e) {
    showError('Update Admins', e)
    throw e
  }
}

/**
 * Delete a conversation. Creator only
 */
export async function deleteConversation(conversationId: number) {
  const step = useModalStore.getState().step
  const show = useModalStore.getState().show
  const showError = useModalStore.getState().showError

  step('Delete Conversation', 'Waiting for wallet', true)

  try {
    const contract = await ShadownetTezos.wallet.at(CONTRACT)
    const op = await contract.methodsObject
      .delete_conversation(conversationId)
      .send()

    await op.confirmation()
    show('Delete Conversation', 'Conversation deleted')
    return op.opHash
  } catch (e) {
    showError('Delete Conversation', e)
    throw e
  }
}
