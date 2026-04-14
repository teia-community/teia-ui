/**
 * Channel contract interactions via Taquito.
 */
import { stringToBytes } from '@taquito/utils'
import { UnitValue } from '@taquito/taquito'
import { MESSAGING_CHANNEL_CONTRACT } from '@constants'
import { Tezos } from '@context/userStore'
import { useModalStore } from '@context/modalStore'
import { uploadMsgFileToIPFS, uploadMsgJsonToIPFS } from './ipfs'
import type { ChannelAccessMode, ChannelMessagePayload } from './channel-types'

const CONTRACT = MESSAGING_CHANNEL_CONTRACT

function accessModeToMichelson(mode: ChannelAccessMode) {
  if (mode === 'allowlist') return { allowlist: UnitValue }
  if (mode === 'blocklist') return { blocklist: UnitValue }
  if (mode === 'members_only') return { members_only: UnitValue }
  return { unrestricted: UnitValue }
}

/**
 * Create a channel + configure access mode in a batch.
 *
 * Known limitation: reads channel_id_counter before broadcasting create_channel.
 * If two users create channels concurrently, the configure_channel call may
 * reference the wrong channel ID. This is a contract-level constraint,
 * a future contract version should accept configuration in the create entrypoint.
 * This will be fixed soon. -> entrypoints will be merged.
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
  accessMode: ChannelAccessMode
  channelFee: number
  merkleRoot?: string
  merkleUri?: string[]
  blocklistAddresses?: string[]
}) {
  const { step, show, showError } = useModalStore.getState()

  step('Create Channel', 'Uploading metadata to IPFS', true)

  try {
    let imageUri: string | undefined
    if (imageFile) {
      const imageCid = await uploadMsgFileToIPFS(imageFile)
      imageUri = `ipfs://${imageCid}`
    }

    const metadata: Record<string, unknown> = {
      type: 'teia-channel',
      version: 1,
      name: name.trim(),
      description: description.trim(),
    }
    if (imageUri) metadata.image = imageUri

    const metadataIpfsUri = await uploadMsgJsonToIPFS(metadata)
    const metadataBytes = stringToBytes(metadataIpfsUri)

    let merkleUriBytes: string | null = null
    if (merkleUri && merkleUri.length > 0) {
      const allowlistIpfsUri = await uploadMsgJsonToIPFS(merkleUri)
      merkleUriBytes = stringToBytes(allowlistIpfsUri)
    }

    step('Create Channel', 'Preparing transaction', false)

    const contract = await Tezos.wallet.at(CONTRACT)
    const storage = await contract.storage<{
      channel_id_counter: { toNumber(): number }
    }>()
    const nextChannelId = storage.channel_id_counter.toNumber()

    const batch = Tezos.wallet
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

    step('Create Channel', `Awaiting confirmation...`)
    await op.confirmation()
    show('Create Channel', `Channel "${name.trim()}" created`)
    return { opHash: op.opHash, channelId: nextChannelId }
  } catch (e) {
    showError('Create Channel', e)
    throw e
  }
}

export async function postMessage({
  channelId,
  content,
  messageFee,
  proof,
  parentId,
  storageMode = 'ipfs',
  embeds,
}: {
  channelId: string
  content: string
  messageFee: number
  proof?: { hash: string; direction: number }[]
  parentId?: string
  storageMode?: 'onchain' | 'ipfs'
  embeds?: unknown[]
}) {
  const { step, show, showError } = useModalStore.getState()

  step('Post Message', 'Preparing', true)

  try {
    const payload: ChannelMessagePayload = {
      type: 'teia-channel-message',
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
        channel_id: parseInt(channelId),
        content: contentBytes,
        proof: proof || null,
        parent_id: parentId ? parseInt(parentId) : null,
      })
      .send({ amount: messageFee, mutez: true })

    step('Post Message', 'Awaiting confirmation...')
    await op.confirmation()
    show('Post Message', 'Message posted')
    return op.opHash
  } catch (e) {
    showError('Post Message', e)
    throw e
  }
}

export async function deleteMessage(messageId: string) {
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

export async function configureChannel({
  channelId,
  accessMode,
  merkleRoot,
  merkleUri,
}: {
  channelId: string
  accessMode: ChannelAccessMode
  merkleRoot?: string
  merkleUri?: string[]
}) {
  const { step, show, showError } = useModalStore.getState()

  step('Configure Channel', 'Preparing', true)

  try {
    let merkleUriBytes: string | null = null
    if (merkleUri && merkleUri.length > 0) {
      const allowlistIpfsUri = await uploadMsgJsonToIPFS(merkleUri)
      merkleUriBytes = stringToBytes(allowlistIpfsUri)
    }

    step('Configure Channel', 'Waiting for wallet', false)

    const contract = await Tezos.wallet.at(CONTRACT)
    const op = await contract.methodsObject
      .configure_channel({
        channel_id: parseInt(channelId),
        access_mode: accessModeToMichelson(accessMode),
        merkle_root: merkleRoot || null,
        merkle_uri: merkleUriBytes,
      })
      .send()

    step('Configure Channel', 'Awaiting confirmation...')
    await op.confirmation()
    show('Configure Channel', 'Channel configured')
    return op.opHash
  } catch (e) {
    showError('Configure Channel', e)
    throw e
  }
}

export async function updateBlocklist({
  channelId,
  toBlock,
  toUnblock,
}: {
  channelId: string
  toBlock: string[]
  toUnblock: string[]
}) {
  const { step, show, showError } = useModalStore.getState()

  step('Update Blocklist', 'Waiting for wallet', true)

  try {
    const contract = await Tezos.wallet.at(CONTRACT)
    const op = await contract.methodsObject
      .update_blocklist({
        channel_id: parseInt(channelId),
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

export async function updateChannelAdmins({
  channelId,
  toAdd,
  toRemove,
}: {
  channelId: string
  toAdd: string[]
  toRemove: string[]
}) {
  const { step, show, showError } = useModalStore.getState()

  step('Update Admins', 'Waiting for wallet', true)

  try {
    const contract = await Tezos.wallet.at(CONTRACT)
    const op = await contract.methodsObject
      .update_channel_admins({
        channel_id: parseInt(channelId),
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

export async function hideChannel(channelId: string) {
  const { step, show, showError } = useModalStore.getState()

  step('Hide Channel', 'Waiting for wallet', true)

  try {
    const contract = await Tezos.wallet.at(CONTRACT)
    const op = await contract.methodsObject
      .hide_channel(parseInt(channelId))
      .send()
    await op.confirmation()
    show('Hide Channel', 'Channel hidden')
    return op.opHash
  } catch (e) {
    showError('Hide Channel', e)
    throw e
  }
}

export async function deleteChannel(channelId: string) {
  const { step, show, showError } = useModalStore.getState()

  step('Delete Channel', 'Waiting for wallet', true)

  try {
    const contract = await Tezos.wallet.at(CONTRACT)
    const op = await contract.methodsObject
      .delete_channel(parseInt(channelId))
      .send()
    await op.confirmation()
    show('Delete Channel', 'Channel deleted')
    return op.opHash
  } catch (e) {
    showError('Delete Channel', e)
    throw e
  }
}
