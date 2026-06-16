/**
 * Channels V2 contract interactions via Taquito.
 *
 * Supports channel lifecycle (create, configure, update, hide),
 * messaging (post, edit, delete, hide/moderate), admin management,
 * and Merkle allowlist operations.
 */
import { stringToBytes } from '@taquito/utils'
import { UnitValue } from '@taquito/taquito'
import { mutate } from 'swr'
import {
  CHANNELS_V2_CONTRACT,
  CHANNEL_FEE,
  CHANNEL_MESSAGE_FEE,
} from '@constants'
import { Tezos, useUserStore } from '@context/userStore'
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

const CONTRACT = CHANNELS_V2_CONTRACT

function accessModeToMichelson(mode: ChannelAccessMode) {
  if (mode === 'allowlist') return { allowlist: UnitValue }
  if (mode === 'closed') return { closed: UnitValue }
  return { unrestricted: UnitValue }
}

function friendlyError(e: unknown): unknown {
  const raw = JSON.stringify(e ?? '')
  if (raw.includes('USER_BANNED')) {
    return new Error('Sorry, you have been banned from this channel.')
  }
  if (raw.includes('USER_BANNED_IN_CHANNEL')) {
    return new Error('You have been banned from this channel.')
  }
  if (raw.includes('CONTRACT_PAUSED')) {
    return new Error('Channels are temporarily paused by governance.')
  }
  if (raw.includes('NOT_AUTHORIZED')) {
    return new Error('You are not authorized to perform this action.')
  }
  if (raw.includes('PARENT_HIDDEN')) {
    return new Error("Can't reply to a hidden message.")
  }
  if (raw.includes('CHANNEL_HIDDEN')) {
    return new Error('This channel has been hidden.')
  }
  if (raw.includes('INVALID_MERKLE_PROOF')) {
    return new Error('Your allowlist proof is invalid.')
  }
  return e
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

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

function invalidateChannelLists(creator: string) {
  mutate(`msg:inbox:${CONTRACT}:${creator}`)
  mutate(`msg:channel-list:${CONTRACT}`)
}

function invalidateChannelMessages(channelId: string) {
  mutate(`msg:channel-messages:${CONTRACT}:${channelId}`)
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

// ---------------------------------------------------------------------------
// Channel lifecycle
// ---------------------------------------------------------------------------

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
  merkleAddresses?: string[]
  participants?: string[]
  admins?: string[]
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
      .send({ amount: CHANNEL_FEE, mutez: true })

    step('Create Channel', 'Awaiting confirmation...')
    await op.confirmation()

    step('Create Channel', 'Resolving new channel id...')
    const channelId = await resolveCreatedChannelIdFromOp(op.opHash)
    invalidateChannelLists(creator)

    show('Create Channel', `Channel "${name.trim()}" created`)
    return { opHash: op.opHash, channelId }
  } catch (e) {
    const friendly = friendlyError(e)
    showError('Create Channel', friendly)
    throw friendly
  }
}

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
      .send({ amount: CHANNEL_FEE, mutez: true })

    step('Start DM', 'Awaiting confirmation...')
    await op.confirmation()

    step('Start DM', 'Resolving new channel id...')
    const channelId = await resolveCreatedChannelIdFromOp(op.opHash)
    invalidateChannelLists(creator)

    show('Start DM', `DM with ${recipient.slice(0, 8)}… started`)
    return { opHash: op.opHash, channelId }
  } catch (e) {
    const friendly = friendlyError(e)
    showError('Start DM', friendly)
    throw friendly
  }
}

export async function configureChannel({
  channelId,
  accessMode,
  merkleAddresses,
}: {
  channelId: string
  accessMode: ChannelAccessMode
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
    const friendly = friendlyError(e)
    showError('Configure Channel', friendly)
    throw friendly
  }
}

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
    const friendly = friendlyError(e)
    showError('Update Channel', friendly)
    throw friendly
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
    const friendly = friendlyError(e)
    showError('Update Admins', friendly)
    throw friendly
  }
}

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

export async function setChannelHidden(channelId: string, hidden: boolean) {
  const { step, show, showError } = useModalStore.getState()
  const title = hidden ? 'Hide Channel' : 'Restore Channel'

  step(title, 'Waiting for wallet', true)

  try {
    const contract = await Tezos.wallet.at(CONTRACT)
    const op = await contract.methodsObject
      .set_channel_hidden({
        channel_id: parseInt(channelId),
        hidden,
      })
      .send()
    await op.confirmation()
    show(title, hidden ? 'Channel hidden' : 'Channel restored')
    return op.opHash
  } catch (e) {
    const friendly = friendlyError(e)
    showError(title, friendly)
    throw friendly
  }
}

export async function setChannelBanned({
  channelId,
  address,
  banned,
}: {
  channelId: string
  address: string
  banned: boolean
}) {
  const { step, show, showError } = useModalStore.getState()
  const title = banned ? 'Ban User' : 'Unban User'

  step(title, 'Waiting for wallet', true)

  try {
    const contract = await Tezos.wallet.at(CONTRACT)
    const op = await contract.methodsObject
      .set_channel_banned({
        channel_id: parseInt(channelId),
        address,
        banned,
      })
      .send()
    await op.confirmation()
    show(title, banned ? 'User banned from channel' : 'User unbanned')
    return op.opHash
  } catch (e) {
    const friendly = friendlyError(e)
    showError(title, friendly)
    throw friendly
  }
}

/**
 * Add or remove an address from the ban list (distinct from the
 * per-channel ban in `setChannelBanned`).
 */
export async function setUserBanned({
  address,
  banned,
}: {
  address: string
  banned: boolean
}) {
  const { step, show, showError } = useModalStore.getState()
  const title = banned ? 'Ban User' : 'Unban User'

  step(title, 'Waiting for wallet', true)

  try {
    const contract = await Tezos.wallet.at(CONTRACT)
    const op = await contract.methodsObject
      .set_user_banned({ address, banned })
      .send()
    await op.confirmation()
    show(title, banned ? 'User banned from channels' : 'User unbanned')
    return op.opHash
  } catch (e) {
    const friendly = friendlyError(e)
    showError(title, friendly)
    throw friendly
  }
}

/** Pause or unpause the whole channels contract. */
export async function setPaused(paused: boolean) {
  const { step, show, showError } = useModalStore.getState()
  const title = paused ? 'Pause Channels' : 'Unpause Channels'

  step(title, 'Waiting for wallet', true)

  try {
    const contract = await Tezos.wallet.at(CONTRACT)
    const op = await contract.methodsObject.set_pause(paused).send()
    await op.confirmation()
    show(title, paused ? 'Channels paused' : 'Channels resumed')
    return op.opHash
  } catch (e) {
    const friendly = friendlyError(e)
    showError(title, friendly)
    throw friendly
  }
}

// ---------------------------------------------------------------------------
// Messaging
// ---------------------------------------------------------------------------

export async function postMessage({
  channelId,
  content,
  proof,
  parentId,
  embeds,
}: {
  channelId: string
  content: string
  proof?: { hash: string; direction: number }[]
  parentId?: string
  embeds?: TokenEmbed[]
}) {
  const { step, show, showError } = useModalStore.getState()

  step('Post Message', 'Uploading to IPFS', true)

  try {
    const payload: ChannelMessagePayload = {
      type: 'teia-channel-message',
      version: 1,
      content,
      author: useUserStore.getState().address ?? '',
      timestamp: new Date().toISOString(),
    }
    if (parentId) payload.parentId = parentId
    if (embeds?.length) payload.embeds = embeds

    const ipfsUri = await uploadMsgJsonToIPFS(
      payload as unknown as Record<string, unknown>
    )
    const contentBytes = stringToBytes(ipfsUri)

    step('Post Message', 'Waiting for wallet confirmation', false)

    const contract = await Tezos.wallet.at(CONTRACT)
    const op = await contract.methodsObject
      .post_message({
        channel_id: parseInt(channelId),
        content: contentBytes,
        proof: proof || null,
        parent_id: parentId ? parseInt(parentId) : null,
      })
      .send({ amount: CHANNEL_MESSAGE_FEE, mutez: true })

    step('Post Message', 'Awaiting confirmation...')
    await op.confirmation()
    invalidateChannelMessages(channelId)
    show('Post Message', 'Message posted')
    return op.opHash
  } catch (e) {
    const friendly = friendlyError(e)
    showError('Post Message', friendly)
    throw friendly
  }
}

export async function editMessage({
  messageId,
  channelId,
  content,
  parentId,
  embeds,
}: {
  messageId: string
  channelId: string
  content: string
  parentId?: string
  embeds?: TokenEmbed[]
}) {
  const { step, show, showError } = useModalStore.getState()

  step('Edit Message', 'Uploading to IPFS', true)

  try {
    const payload: ChannelMessagePayload = {
      type: 'teia-channel-message',
      version: 1,
      content,
      author: useUserStore.getState().address ?? '',
      timestamp: new Date().toISOString(),
    }
    if (parentId) payload.parentId = parentId
    if (embeds?.length) payload.embeds = embeds

    const ipfsUri = await uploadMsgJsonToIPFS(
      payload as unknown as Record<string, unknown>
    )
    const contentBytes = stringToBytes(ipfsUri)

    step('Edit Message', 'Waiting for wallet confirmation', false)

    const contract = await Tezos.wallet.at(CONTRACT)
    const op = await contract.methodsObject
      .edit_message({
        message_id: parseInt(messageId),
        content: contentBytes,
      })
      .send()

    step('Edit Message', 'Awaiting confirmation...')
    await op.confirmation()
    invalidateChannelMessages(channelId)
    show('Edit Message', 'Message updated')
    return op.opHash
  } catch (e) {
    const friendly = friendlyError(e)
    showError('Edit Message', friendly)
    throw friendly
  }
}

export async function deleteMessage({
  messageId,
  channelId,
}: {
  messageId: string
  channelId: string
}) {
  const { step, show, showError } = useModalStore.getState()

  step('Delete Message', 'Waiting for wallet', true)

  try {
    const contract = await Tezos.wallet.at(CONTRACT)
    const op = await contract.methodsObject
      .delete_message(parseInt(messageId))
      .send()

    step('Delete Message', 'Awaiting confirmation...')
    await op.confirmation()
    invalidateChannelMessages(channelId)
    show('Delete Message', 'Message deleted')
    return op.opHash
  } catch (e) {
    const friendly = friendlyError(e)
    showError('Delete Message', friendly)
    throw friendly
  }
}

export async function setOwnMessageHidden({
  messageId,
  channelId,
  hidden,
}: {
  messageId: string
  channelId: string
  hidden: boolean
}) {
  const { step, show, showError } = useModalStore.getState()
  const title = hidden ? 'Hide Message' : 'Unhide Message'

  step(title, 'Waiting for wallet', true)

  try {
    const contract = await Tezos.wallet.at(CONTRACT)
    const op = await contract.methodsObject
      .set_own_message_hidden({
        message_id: parseInt(messageId),
        hidden,
      })
      .send()

    step(title, 'Awaiting confirmation...')
    await op.confirmation()
    invalidateChannelMessages(channelId)
    show(title, hidden ? 'Message hidden' : 'Message restored')
    return op.opHash
  } catch (e) {
    const friendly = friendlyError(e)
    showError(title, friendly)
    throw friendly
  }
}

export async function moderateMessageHidden({
  messageId,
  channelId,
  hidden,
}: {
  messageId: string
  channelId: string
  hidden: boolean
}) {
  const { step, show, showError } = useModalStore.getState()
  const title = hidden ? 'Moderate: Hide' : 'Moderate: Unhide'

  step(title, 'Waiting for wallet', true)

  try {
    const contract = await Tezos.wallet.at(CONTRACT)
    const op = await contract.methodsObject
      .moderate_message_hidden({
        message_id: parseInt(messageId),
        hidden,
      })
      .send()

    step(title, 'Awaiting confirmation...')
    await op.confirmation()
    invalidateChannelMessages(channelId)
    show(title, hidden ? 'Message hidden by moderator' : 'Message restored by moderator')
    return op.opHash
  } catch (e) {
    const friendly = friendlyError(e)
    showError(title, friendly)
    throw friendly
  }
}
