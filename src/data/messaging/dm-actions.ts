/**
 * DM Contract Actions
 */
import { stringToBytes } from '@taquito/utils'
import { SHADOWNET_DM_CONTRACT } from '@constants'
import { ShadownetTezos, useShadownetStore } from '@context/shadownetStore'
import { useModalStore } from '@context/modalStore'
import { uploadFileToIPFSProxy } from '../ipfs'
import type { DmMessagePayload } from './dm-types'

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
 * Post a message to a peer (room auto-creates on first message)
 */
export async function postDmMessage({
  recipient,
  content,
  messageFee,
  parentId,
  storageMode = 'onchain',
  embeds,
}: {
  recipient: string
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
        recipient,
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
 * Update room metadata (name/description)
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
  const step = useModalStore.getState().step
  const show = useModalStore.getState().show
  const showError = useModalStore.getState().showError

  step('Update Room', 'Uploading metadata to IPFS', true)

  try {
    const metadata = {
      type: 'teia-dm',
      version: 1,
      name: name.trim(),
      description: description.trim(),
    }

    const metadataIpfsUri = await uploadJsonToIPFS(
      metadata as unknown as Record<string, unknown>
    )
    const metadataBytes = stringToBytes(metadataIpfsUri)

    step('Update Room', 'Waiting for wallet', false)

    const contract = await ShadownetTezos.wallet.at(CONTRACT)
    const op = await contract.methodsObject
      .update_room_metadata({
        peer,
        metadata_uri: metadataBytes,
      })
      .send()

    step(
      'Update Room',
      `Awaiting confirmation of [operation](https://shadownet.tzkt.io/${op.opHash})`
    )
    await op.confirmation()
    show('Update Room', 'Room metadata updated')
    return op.opHash
  } catch (e) {
    showError('Update Room', e)
    throw e
  }
}
