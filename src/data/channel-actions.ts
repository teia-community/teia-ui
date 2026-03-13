/**
 * Channel Contract Actions
 */
import { stringToBytes } from '@taquito/utils'
import { UnitValue } from '@taquito/taquito'
import { SHADOWNET_CHANNEL_CONTRACT } from '@constants'
import { ShadownetTezos, useShadownetStore } from '@context/shadownetStore'
import { useModalStore } from '@context/modalStore'
import { uploadFileToIPFSProxy } from './ipfs'
import type { AccessMode, ChannelMetadata, ChannelMessagePayload } from './channel-types'

/** Upload a raw File to IPFS, returns the CID. */
async function uploadToIPFS(file: File): Promise<string> {
  const cid = await uploadFileToIPFSProxy(
    { blob: file, path: file.name, size: file.size },
    'Channel'
  )
  if (!cid) throw new Error('IPFS upload failed')
  return cid
}

/** Upload a JSON object to IPFS, returns `ipfs://CID`. */
async function uploadJsonToIPFS(data: Record<string, unknown>): Promise<string> {
  const blob = new Blob([JSON.stringify(data)], { type: 'application/json' })
  const cid = await uploadToIPFS(new File([blob], 'metadata.json', { type: 'application/json' }))
  return `ipfs://${cid}`
}

const CONTRACT = SHADOWNET_CHANNEL_CONTRACT

function accessModeToMichelson(mode: AccessMode) {
  if (mode === 'allowlist') return { allowlist: UnitValue }
  if (mode === 'blocklist') return { blocklist: UnitValue }
  return { unrestricted: UnitValue }
}

function getAddress() {
  return useShadownetStore.getState().address
}

/**
 * Create a channel + optionally configure access mode in a batch.
 */
export async function createChannel({
  name,
  description,
  imageFile,
  accessMode,
  channelFee,
  merkleRoot,
  merkleUri,
  blocklistAddresses,
}: {
  name: string
  description: string
  imageFile?: File
  accessMode: AccessMode
  channelFee: number
  merkleRoot?: string
  merkleUri?: string[]
  blocklistAddresses?: string[]
}) {
  const step = useModalStore.getState().step
  const show = useModalStore.getState().show
  const showError = useModalStore.getState().showError

  step('Create Channel', 'Uploading metadata to IPFS', true)

  try {
    // Upload image (optional)
    let imageUri: string | undefined
    if (imageFile) {
      const imageCid = await uploadToIPFS(imageFile)
      imageUri = `ipfs://${imageCid}`
    }

    // Build and upload channel metadata
    const metadata: Record<string, unknown> = {
      type: 'teia-channel',
      version: 1,
      name: name.trim(),
      description: description.trim(),
    }
    if (imageUri) metadata.image = imageUri

    const metadataIpfsUri = await uploadJsonToIPFS(metadata)
    const metadataBytes = stringToBytes(metadataIpfsUri)

    // Upload allowlist addresses to IPFS if provided
    let merkleUriBytes: string | null = null
    if (merkleUri && merkleUri.length > 0) {
      step('Create Channel', 'Uploading allowlist to IPFS', true)
      const allowlistIpfsUri = await uploadJsonToIPFS(merkleUri as unknown as Record<string, unknown>)
      merkleUriBytes = stringToBytes(allowlistIpfsUri)
    }

    step('Create Channel', 'Preparing transaction', false)

    const contract = await ShadownetTezos.wallet.at(CONTRACT)
    const storage = await contract.storage<{
      channel_id_counter: { toNumber(): number }
    }>()
    const nextChannelId = storage.channel_id_counter.toNumber()

    const batch = ShadownetTezos.wallet
      .batch()
      .withContractCall(
        contract.methodsObject.create_channel(metadataBytes),
        { amount: channelFee, mutez: true }
      )
      .withContractCall(
        contract.methodsObject.configure_channel({
          channel_id: nextChannelId,
          access_mode: accessModeToMichelson(accessMode),
          merkle_root: merkleRoot || null,
          merkle_uri: merkleUriBytes,
        })
      )

    if (blocklistAddresses && blocklistAddresses.length > 0) {
      batch.withContractCall(
        contract.methodsObject.update_blocklist({
          channel_id: nextChannelId,
          to_block: blocklistAddresses,
          to_unblock: [],
        })
      )
    }

    step('Create Channel', 'Waiting for wallet confirmation', false)
    const op = await batch.send()

    step(
      'Create Channel',
      `Awaiting confirmation of [operation](https://shadownet.tzkt.io/${op.opHash})`
    )
    await op.confirmation()
    show('Create Channel', `Channel #${name.trim()} created`)
    return { opHash: op.opHash, channelId: nextChannelId }
  } catch (e) {
    showError('Create Channel', e)
    throw e
  }
}

/**
 * Post a message to a channel.
 */
export async function postMessage({
  channelId,
  content,
  messageFee,
  proof,
  parentId,
  storageMode = 'onchain',
}: {
  channelId: number
  content: string
  messageFee: number
  proof?: { hash: string; direction: number }[]
  parentId?: number
  storageMode?: 'onchain' | 'ipfs'
}) {
  const step = useModalStore.getState().step
  const show = useModalStore.getState().show
  const showError = useModalStore.getState().showError
  const author = getAddress()

  step('Post Message', 'Preparing transaction', true)

  try {
    // Build rich message payload
    const payload: ChannelMessagePayload = {
      type: 'teia-channel-message',
      version: 1,
      content,
      author: author || '',
      timestamp: new Date().toISOString(),
    }
    if (parentId !== undefined) payload.parentId = parentId

    let contentBytes: string
    if (storageMode === 'ipfs') {
      step('Post Message', 'Uploading to IPFS', true)
      const ipfsUri = await uploadJsonToIPFS(payload as unknown as Record<string, unknown>)
      contentBytes = stringToBytes(ipfsUri)
    } else {
      contentBytes = stringToBytes(JSON.stringify(payload))
    }

    const contract = await ShadownetTezos.wallet.at(CONTRACT)
    const op = await contract.methodsObject
      .post_message({
        channel_id: channelId,
        content: contentBytes,
        proof: proof
          ? proof.map((s) => ({ hash: s.hash, direction: s.direction }))
          : null,
        parent_id: parentId !== undefined ? parentId : null,
      })
      .send({ amount: messageFee, mutez: true })

    step(
      'Post Message',
      `Awaiting confirmation of [operation](https://shadownet.tzkt.io/${op.opHash})`
    )
    await op.confirmation()
    show('Post Message', 'Message posted')
    return op.opHash
  } catch (e) {
    showError('Post Message', e)
    throw e
  }
}

/**
 * Delete a message (sender or channel creator).
 */
export async function deleteMessage(messageId: number) {
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
 * Configure channel access mode.
 */
export async function configureChannel({
  channelId,
  accessMode,
  merkleRoot,
  merkleUri,
}: {
  channelId: number
  accessMode: AccessMode
  merkleRoot?: string
  merkleUri?: string[]
}) {
  const step = useModalStore.getState().step
  const show = useModalStore.getState().show
  const showError = useModalStore.getState().showError

  step('Configure Channel', 'Preparing', true)

  try {
    // Upload allowlist addresses to IPFS if provided
    let merkleUriBytes: string | null = null
    if (merkleUri && merkleUri.length > 0) {
      step('Configure Channel', 'Uploading allowlist to IPFS', true)
      const allowlistIpfsUri = await uploadJsonToIPFS(merkleUri as unknown as Record<string, unknown>)
      merkleUriBytes = stringToBytes(allowlistIpfsUri)
    }

    step('Configure Channel', 'Waiting for wallet', false)

    const contract = await ShadownetTezos.wallet.at(CONTRACT)
    const op = await contract.methodsObject
      .configure_channel({
        channel_id: channelId,
        access_mode: accessModeToMichelson(accessMode),
        merkle_root: merkleRoot || null,
        merkle_uri: merkleUriBytes,
      })
      .send()

    step(
      'Configure Channel',
      `Awaiting confirmation of [operation](https://shadownet.tzkt.io/${op.opHash})`
    )
    await op.confirmation()
    show('Configure Channel', 'Channel configured')
    return op.opHash
  } catch (e) {
    showError('Configure Channel', e)
    throw e
  }
}

/**
 * Add/remove addresses from blocklist.
 */
export async function updateBlocklist({
  channelId,
  toBlock,
  toUnblock,
}: {
  channelId: number
  toBlock: string[]
  toUnblock: string[]
}) {
  const step = useModalStore.getState().step
  const show = useModalStore.getState().show
  const showError = useModalStore.getState().showError

  step('Update Blocklist', 'Waiting for wallet', true)

  try {
    const contract = await ShadownetTezos.wallet.at(CONTRACT)
    const op = await contract.methodsObject
      .update_blocklist({
        channel_id: channelId,
        to_block: toBlock,
        to_unblock: toUnblock,
      })
      .send()

    await op.confirmation()
    show('Update Blocklist', 'Blocklist updated')
    return op.opHash
  } catch (e) {
    showError('Update Blocklist', e)
    throw e
  }
}

/**
 * Update channel metadata.
 */
export async function updateChannel({
  channelId,
  metadataUri,
}: {
  channelId: number
  metadataUri: string
}) {
  const step = useModalStore.getState().step
  const show = useModalStore.getState().show
  const showError = useModalStore.getState().showError

  step('Update Channel', 'Waiting for wallet', true)

  try {
    const contract = await ShadownetTezos.wallet.at(CONTRACT)
    const op = await contract.methodsObject
      .update_channel({
        channel_id: channelId,
        metadata_uri: stringToBytes(metadataUri),
      })
      .send()

    await op.confirmation()
    show('Update Channel', 'Channel updated')
    return op.opHash
  } catch (e) {
    showError('Update Channel', e)
    throw e
  }
}

/**
 * Hide a channel (soft delete). Creator only.
 */
export async function hideChannel(channelId: number) {
  const step = useModalStore.getState().step
  const show = useModalStore.getState().show
  const showError = useModalStore.getState().showError

  step('Hide Channel', 'Waiting for wallet', true)

  try {
    const contract = await ShadownetTezos.wallet.at(CONTRACT)
    const op = await contract.methodsObject.hide_channel(channelId).send()
    await op.confirmation()
    show('Hide Channel', 'Channel hidden')
    return op.opHash
  } catch (e) {
    showError('Hide Channel', e)
    throw e
  }
}

/**
 * Delete a channel (hard delete). Creator only.
 */
export async function deleteChannel(channelId: number) {
  const step = useModalStore.getState().step
  const show = useModalStore.getState().show
  const showError = useModalStore.getState().showError

  step('Delete Channel', 'Waiting for wallet', true)

  try {
    const contract = await ShadownetTezos.wallet.at(CONTRACT)
    const op = await contract.methodsObject.delete_channel(channelId).send()
    await op.confirmation()
    show('Delete Channel', 'Channel deleted')
    return op.opHash
  } catch (e) {
    showError('Delete Channel', e)
    throw e
  }
}
