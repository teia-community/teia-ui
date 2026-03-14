/**
 * Token Gate Contract Actions
 */
import { stringToBytes } from '@taquito/utils'
import { SHADOWNET_TOKEN_GATE_CONTRACT } from '@constants'
import { ShadownetTezos, useShadownetStore } from '@context/shadownetStore'
import { useModalStore } from '@context/modalStore'
import { uploadFileToIPFSProxy } from './ipfs'
import type { TgMessagePayload } from './token-gate-types'

const CONTRACT = SHADOWNET_TOKEN_GATE_CONTRACT

async function uploadJsonToIPFS(
  data: Record<string, unknown>
): Promise<string> {
  const blob = new Blob([JSON.stringify(data)], { type: 'application/json' })
  const file = new File([blob], 'metadata.json', { type: 'application/json' })
  const cid = await uploadFileToIPFSProxy(
    { blob: file, path: file.name, size: file.size },
    'TokenGate'
  )
  if (!cid) throw new Error('IPFS upload failed')
  return `ipfs://${cid}`
}

function getAddress() {
  return useShadownetStore.getState().address
}

/**
 * Post a message to a token room
 * The contract will call FA2 balance_of to verify token ownership
 */
export async function postTokenGateMessage({
  fa2Address,
  tokenId,
  content,
  messageFee,
  parentId,
  storageMode = 'onchain',
}: {
  fa2Address: string
  tokenId: number
  content: string
  messageFee: number
  parentId?: number
  storageMode?: 'onchain' | 'ipfs'
}) {
  const step = useModalStore.getState().step
  const show = useModalStore.getState().show
  const showError = useModalStore.getState().showError
  const author = getAddress()

  step('Post Message', 'Preparing', true)

  try {
    const payload: TgMessagePayload = {
      type: 'teia-tg-message',
      version: 1,
      content,
      author: author || '',
      timestamp: new Date().toISOString(),
    }
    if (parentId !== undefined) payload.parentId = parentId

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
        fa2_address: fa2Address,
        token_id: tokenId,
        content: contentBytes,
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
 * Delete a message. Creator only
 */
export async function deleteTokenGateMessage(messageId: number) {
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
