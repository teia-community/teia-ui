/**
 * DM contract interactions via Taquito.
 */
import { stringToBytes } from '@taquito/utils'
import { MESSAGING_DM_CONTRACT } from '@constants'
import { Tezos } from '@context/userStore'
import { useModalStore } from '@context/modalStore'
import { uploadMsgJsonToIPFS } from './ipfs'
import type { DmMessagePayload } from './dm-types'

const CONTRACT = MESSAGING_DM_CONTRACT

/**
 * Post a message to a peer (room auto-creates on first message).
 */
export async function postDmMessage({
  recipient,
  content,
  messageFee,
  parentId,
  storageMode = 'ipfs',
  embeds,
}: {
  recipient: string
  content: string
  messageFee: number
  parentId?: string
  storageMode?: 'onchain' | 'ipfs'
  embeds?: unknown[]
}) {
  const { step, show, showError } = useModalStore.getState()

  step('Post Message', 'Preparing', true)

  try {
    const payload: DmMessagePayload = {
      type: 'teia-dm-message',
      version: 1,
      content,
      author: '',
      timestamp: new Date().toISOString(),
    }
    if (parentId) payload.parentId = parentId
    if (embeds?.length) payload.embeds = embeds

    let contentBytes: string
    if (storageMode === 'ipfs') {
      const ipfsUri = await uploadMsgJsonToIPFS(
        payload as unknown as Record<string, unknown>
      )
      contentBytes = stringToBytes(ipfsUri)
    } else {
      contentBytes = stringToBytes(JSON.stringify(payload))
    }

    const contract = await Tezos.wallet.at(CONTRACT)
    const op = await contract.methodsObject
      .post_message({
        recipient,
        content: contentBytes,
        parent_id: parentId ? parseInt(parentId) : null,
      })
      .send({ amount: messageFee, mutez: true })

    step('Post Message', 'Awaiting confirmation...')
    await op.confirmation()
    show('Post Message', 'Message sent')
    return op.opHash
  } catch (e) {
    showError('Post Message', e)
    throw e
  }
}

/**
 * Delete a DM message. Sender only.
 */
export async function deleteDmMessage(messageId: string) {
  const { step, show, showError } = useModalStore.getState()

  step('Delete Message', 'Waiting for wallet', true)

  try {
    const contract = await Tezos.wallet.at(CONTRACT)
    const op = await contract.methodsObject
      .delete_message(parseInt(messageId))
      .send()

    step('Delete Message', 'Awaiting confirmation...')
    await op.confirmation()
    show('Delete Message', 'Message deleted')
    return op.opHash
  } catch (e) {
    showError('Delete Message', e)
    throw e
  }
}

/**
 * Update room metadata (name/description).
 */
export async function updateRoomMetadata({
  peer,
  name,
  description,
}: {
  peer: string
  name: string
  description: string
}) {
  const { step, show, showError } = useModalStore.getState()

  step('Update Room', 'Uploading metadata to IPFS', true)

  try {
    const metadata = {
      type: 'teia-dm',
      version: 1,
      name: name.trim(),
      description: description.trim(),
    }

    const metadataIpfsUri = await uploadMsgJsonToIPFS(metadata)
    const metadataBytes = stringToBytes(metadataIpfsUri)

    step('Update Room', 'Waiting for wallet', false)

    const contract = await Tezos.wallet.at(CONTRACT)
    const op = await contract.methodsObject
      .update_room_metadata({
        peer,
        metadata_uri: metadataBytes,
      })
      .send()

    step('Update Room', 'Awaiting confirmation...')
    await op.confirmation()
    show('Update Room', 'Room metadata updated')
    return op.opHash
  } catch (e) {
    showError('Update Room', e)
    throw e
  }
}
