/**
 * Token gate contract interactions via Taquito.
 * The contract verifies FA2 token balance on-chain before allowing posts.
 */
import { stringToBytes } from '@taquito/utils'
import { MESSAGING_TOKEN_GATE_CONTRACT } from '@constants'
import { Tezos } from '@context/userStore'
import { useModalStore } from '@context/modalStore'
import { uploadMsgJsonToIPFS } from './ipfs'
import type { TgMessagePayload } from './token-gate-types'

const CONTRACT = MESSAGING_TOKEN_GATE_CONTRACT

/**
 * Post a message to a token-gated room.
 * The contract calls FA2 balance_of to verify token ownership.
 */
export async function postTokenGateMessage({
  fa2Address,
  tokenId,
  content,
  messageFee,
  parentId,
  storageMode = 'ipfs',
  embeds,
}: {
  fa2Address: string
  tokenId: string
  content: string
  messageFee: number
  parentId?: string
  storageMode?: 'onchain' | 'ipfs'
  embeds?: unknown[]
}) {
  const { step, show, showError } = useModalStore.getState()

  step('Post Message', 'Preparing', true)

  try {
    const payload: TgMessagePayload = {
      type: 'teia-tg-message',
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
        fa2_address: fa2Address,
        token_id: parseInt(tokenId),
        content: contentBytes,
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

/**
 * Delete a message from a token-gated room. Sender only.
 */
export async function deleteTokenGateMessage(messageId: string) {
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
