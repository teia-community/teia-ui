/**
 * Channels contract interactions via Taquito.
 *
 * Consolidated DM & Channels, more info in teia smart contract repo
 */
import { stringToBytes } from '@taquito/utils'
import { UnitValue } from '@taquito/taquito'
import { mutate } from 'swr'
import {
  MESSAGING_CHANNELS_V2_CONTRACT,
  MESSAGING_CHANNEL_FEE,
  MESSAGING_MESSAGE_FEE,
} from '@constants'
import { Tezos } from '@context/userStore'
import { useModalStore } from '@context/modalStore'
import { computeMerkleRoot } from '@utils/merkle'
import { fetchEventsPage, fetchTransactionsByOpHash } from './api'
import { uploadMsgFileToIPFS, uploadMsgJsonToIPFS } from './ipfs'
import type {
  ChannelAccessMode,
  ChannelCreatedEvent,
  ChannelKind,
  ChannelMessagePayload,
  TokenEmbed,
} from './channel-types'

const CONTRACT = MESSAGING_CHANNELS_V2_CONTRACT

function accessModeToMichelson(mode: ChannelAccessMode) {
  if (mode === 'allowlist') return { allowlist: UnitValue }
  if (mode === 'closed') return { closed: UnitValue }
  return { unrestricted: UnitValue }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

/**
 * Read TZKT create channel event to resolve channel id
 */
async function resolveCreatedChannelIdFromOp(
  opHash: string,
  { attempts = 15, delayMs = 1000 }: { attempts?: number; delayMs?: number } = {}
): Promise<string | null> {
  for (let i = 0; i < attempts; i++) {
    const txs = await fetchTransactionsByOpHash(opHash)
    const ourTx = txs.find(
      (t) =>
        t.target?.address === CONTRACT &&
        t.parameter?.entrypoint === 'create_channel' &&
        t.status === 'applied'
    )
    if (ourTx?.id) {
      const events = await fetchEventsPage<ChannelCreatedEvent>(
        CONTRACT,
        'channel_created',
        { 'transactionId.eq': String(ourTx.id) },
        { limit: 1 }
      )
      if (events[0]) return events[0].payload.channel_id
    }
    await sleep(delayMs)
  }
  return null
}

/** Drop SWR caches for the inbox + channel list so the new channel shows up. */
function invalidateChannelLists(creator: string) {
  mutate(`msg:inbox:${CONTRACT}:${creator}`)
  mutate(`msg:channel-list:${CONTRACT}`)
}

async function buildChannelMetadataUri({
  kind,
  name,
  description,
  imageFile,
  participants,
}: {
  kind: ChannelKind
  name: string
  description: string
  imageFile?: File
  participants?: string[]
}): Promise<string> {
  let imageUri: string | undefined
  if (imageFile) {
    const imageCid = await uploadMsgFileToIPFS(imageFile)
    imageUri = `ipfs://${imageCid}`
  }

  const metadata: Record<string, unknown> = {
    type: 'teia-channel',
    version: 1,
    kind,
    name: name.trim(),
    description: description.trim(),
  }
  if (imageUri) metadata.image = imageUri
  if (participants) metadata.participants = participants

  return uploadMsgJsonToIPFS(metadata)
}

/**
 * Create a channel.
 */
export async function createChannel({
  kind = 'channel',
  name,
  description,
  imageFile,
  accessMode,
  merkleAddresses,
  participants,
  admins = [],
  creator,
}: {
  kind?: ChannelKind
  name: string
  description: string
  imageFile?: File
  accessMode: ChannelAccessMode
  /** Address list to seed the allowlist. Required when accessMode='allowlist'. */
  merkleAddresses?: string[]
  participants?: string[]
  /** Initial admin set written into channel_admins at creation. */
  admins?: string[]
  /** Used to invalidate the inbox SWR cache after creation. */
  creator: string
}) {
  const { step, show, showError } = useModalStore.getState()

  step('Create Channel', 'Uploading metadata to IPFS', true)

  try {
    const metadataIpfsUri = await buildChannelMetadataUri({
      kind,
      name,
      description,
      imageFile,
      participants,
    })
    const metadataBytes = stringToBytes(metadataIpfsUri)

    let merkleRoot: string | null = null
    let merkleUriBytes: string | null = null
    if (accessMode === 'allowlist') {
      if (!merkleAddresses || merkleAddresses.length === 0) {
        throw new Error('Allowlist mode requires at least one address')
      }
      merkleRoot = computeMerkleRoot(merkleAddresses)
      const listUri = await uploadMsgJsonToIPFS(merkleAddresses)
      merkleUriBytes = stringToBytes(listUri)
    }

    step('Create Channel', 'Waiting for wallet confirmation', false)

    const contract = await Tezos.wallet.at(CONTRACT)
    const op = await contract.methodsObject
      .create_channel({
        metadata_uri: metadataBytes,
        access_mode: accessModeToMichelson(accessMode),
        merkle_root: merkleRoot,
        merkle_uri: merkleUriBytes,
        admins,
      })
      .send({ amount: MESSAGING_CHANNEL_FEE, mutez: true })

    step('Create Channel', 'Awaiting confirmation...')
    await op.confirmation()

    step('Create Channel', 'Resolving new channel id...')
    const channelId = await resolveCreatedChannelIdFromOp(op.opHash)
    invalidateChannelLists(creator)

    show('Create Channel', `Channel "${name.trim()}" created`)
    return { opHash: op.opHash, channelId }
  } catch (e) {
    showError('Create Channel', e)
    throw e
  }
}

/**
 * Create a private 1-on-1 DM channel.
 */
export async function createDmChannel({
  recipient,
  creator,
  name,
  description = '',
}: {
  recipient: string
  creator: string
  name: string
  description?: string
}) {
  const { step, show, showError } = useModalStore.getState()

  step('Start DM', 'Uploading metadata to IPFS', true)

  try {
    const participants = [creator, recipient]
    const metadataIpfsUri = await buildChannelMetadataUri({
      kind: 'dm',
      name,
      description,
      participants,
    })
    const metadataBytes = stringToBytes(metadataIpfsUri)

    step('Start DM', 'Waiting for wallet confirmation', false)

    const contract = await Tezos.wallet.at(CONTRACT)
    const op = await contract.methodsObject
      .create_channel({
        metadata_uri: metadataBytes,
        access_mode: accessModeToMichelson('closed'),
        merkle_root: null,
        merkle_uri: null,
        admins: [recipient],
      })
      .send({ amount: MESSAGING_CHANNEL_FEE, mutez: true })

    step('Start DM', 'Awaiting confirmation...')
    await op.confirmation()

    step('Start DM', 'Resolving new channel id...')
    const channelId = await resolveCreatedChannelIdFromOp(op.opHash)
    invalidateChannelLists(creator)

    show('Start DM', `DM with ${recipient.slice(0, 8)}… started`)
    return { opHash: op.opHash, channelId }
  } catch (e) {
    showError('Start DM', e)
    throw e
  }
}

export async function postMessage({
  channelId,
  content,
  proof,
  parentId,
  storageMode = 'ipfs',
  embeds,
}: {
  channelId: string
  content: string
  proof?: { hash: string; direction: number }[]
  parentId?: string
  storageMode?: 'onchain' | 'ipfs'
  embeds?: TokenEmbed[]
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
      .send({ amount: MESSAGING_MESSAGE_FEE, mutez: true })

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

/**
 * Update channel access mode and Merkle root/uri.
 * Caller must be the channel creator or an admin.
 */
export async function configureChannel({
  channelId,
  accessMode,
  merkleAddresses,
}: {
  channelId: string
  accessMode: ChannelAccessMode
  /** Required when accessMode='allowlist'. Pass the full new list. */
  merkleAddresses?: string[]
}) {
  const { step, show, showError } = useModalStore.getState()

  step('Configure Channel', 'Preparing', true)

  try {
    let merkleRoot: string | null = null
    let merkleUriBytes: string | null = null
    if (accessMode === 'allowlist') {
      if (!merkleAddresses || merkleAddresses.length === 0) {
        throw new Error('Allowlist mode requires at least one address')
      }
      merkleRoot = computeMerkleRoot(merkleAddresses)
      const listUri = await uploadMsgJsonToIPFS(merkleAddresses)
      merkleUriBytes = stringToBytes(listUri)
    }

    step('Configure Channel', 'Waiting for wallet', false)

    const contract = await Tezos.wallet.at(CONTRACT)
    const op = await contract.methodsObject
      .configure_channel({
        channel_id: parseInt(channelId),
        access_mode: accessModeToMichelson(accessMode),
        merkle_root: merkleRoot,
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

/**
 * Replace the channel's metadata_uri (name/description/image/kind).
 * Caller must be the channel creator or an admin.
 */
export async function updateChannel({
  channelId,
  kind,
  name,
  description,
  imageFile,
  participants,
}: {
  channelId: string
  kind: ChannelKind
  name: string
  description: string
  imageFile?: File
  participants?: string[]
}) {
  const { step, show, showError } = useModalStore.getState()

  step('Update Channel', 'Uploading metadata to IPFS', true)

  try {
    const metadataIpfsUri = await buildChannelMetadataUri({
      kind,
      name,
      description,
      imageFile,
      participants,
    })
    const metadataBytes = stringToBytes(metadataIpfsUri)

    step('Update Channel', 'Waiting for wallet', false)

    const contract = await Tezos.wallet.at(CONTRACT)
    const op = await contract.methodsObject
      .update_channel({
        channel_id: parseInt(channelId),
        metadata_uri: metadataBytes,
      })
      .send()

    step('Update Channel', 'Awaiting confirmation...')
    await op.confirmation()
    show('Update Channel', 'Channel updated')
    return op.opHash
  } catch (e) {
    showError('Update Channel', e)
    throw e
  }
}

/**
 * Add or remove channel admins. Creator only.
 */
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

/**
 * Add Merkle (allowlist) users by appending to the existing list.
 * Rebuilds the tree, uploads the new list to IPFS, and reconfigures the channel.
 *
 * Only valid for `allowlist` channels. Callers must not invoke this on a
 * `closed` channel, doing so would switch the channel out of closed mode
 * as a side effect (configure_channel sets access_mode='allowlist').
 */
export async function addMerkleUsers({
  channelId,
  currentList,
  addresses,
}: {
  channelId: string
  currentList: string[]
  addresses: string[]
}) {
  const set = new Set(currentList)
  for (const addr of addresses) set.add(addr)
  const newList = Array.from(set)
  return configureChannel({
    channelId,
    accessMode: 'allowlist',
    merkleAddresses: newList,
  })
}

/**
 * Remove Merkle (allowlist) users from the existing list.
 *
 * Only valid for `allowlist` channels, see addMerkleUsers note.
 */
export async function removeMerkleUsers({
  channelId,
  currentList,
  addresses,
}: {
  channelId: string
  currentList: string[]
  addresses: string[]
}) {
  const remove = new Set(addresses)
  const newList = currentList.filter((a) => !remove.has(a))
  if (newList.length === 0) {
    throw new Error('Cannot remove all Merkle users; switch access mode instead')
  }
  return configureChannel({
    channelId,
    accessMode: 'allowlist',
    merkleAddresses: newList,
  })
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
