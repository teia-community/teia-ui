/**
 * Token comments contract interactions.
 *
 * The contract is per-call token-gated: each `post_comment` carries the
 * (fa2_address, token_id) it targets, and the contract calls `balance_of`
 * on that FA2 to confirm the sender holds at least one unit before writing
 * the comment.
 *
 * Comments are stored on IPFS via the messaging gateway; only the ipfs://
 * URI is written on-chain.
 */
import { stringToBytes } from '@taquito/utils'
import { mutate } from 'swr'
import { TOKEN_COMMENTS_CONTRACT, TOKEN_MESSAGE_FEE } from '@constants'
import { Tezos, useUserStore } from '@context/userStore'
import { useModalStore } from '@context/modalStore'
import { uploadMsgJsonToIPFS } from './ipfs'
import type { TokenCommentPayload } from './token-comments-types'

const CONTRACT = TOKEN_COMMENTS_CONTRACT

function friendlyError(e: unknown): unknown {
  const raw = JSON.stringify(e ?? '')
  if (raw.includes('USER_BANNED')) {
    return new Error('Sorry, you have been banned from commenting.')
  }
  if (raw.includes('NOT_TOKEN_HOLDER')) {
    return new Error('You must own this token to comment.')
  }
  if (raw.includes('CONTRACT_PAUSED')) {
    return new Error('Comments are temporarily paused by governance.')
  }
  if (raw.includes('PARENT_HIDDEN')) {
    return new Error("Can't reply to a hidden comment.")
  }
  if (raw.includes('PARENT_WRONG_TOKEN')) {
    return new Error("Replies must be on the same token as the parent comment.")
  }
  return e
}

function invalidateToken(fa2Address: string, tokenId: string) {
  mutate(`msg:token-comments:${CONTRACT}:${fa2Address}:${tokenId}`)
}

async function buildContentBytes(
  payload: TokenCommentPayload
): Promise<string> {
  const ipfsUri = await uploadMsgJsonToIPFS(
    payload as unknown as Record<string, unknown>
  )
  return stringToBytes(ipfsUri)
}

export async function postComment({
  fa2Address,
  tokenId,
  content,
  parentId,
}: {
  fa2Address: string
  tokenId: string
  content: string
  parentId?: string
}) {
  const { step, show, showError } = useModalStore.getState()

  step('Post Comment', 'Uploading to IPFS', true)

  try {
    const payload: TokenCommentPayload = {
      type: 'teia-token-comment',
      version: 1,
      fa2Address,
      tokenId,
      content,
      author: useUserStore.getState().address ?? '',
      timestamp: new Date().toISOString(),
    }
    if (parentId) payload.parentId = parentId

    const contentBytes = await buildContentBytes(payload)

    step('Post Comment', 'Waiting for wallet confirmation', false)

    const contract = await Tezos.wallet.at(CONTRACT)
    const op = await contract.methodsObject
      .post_comment({
        fa2_address: fa2Address,
        token_id: parseInt(tokenId),
        content: contentBytes,
        parent_id: parentId ? parseInt(parentId) : null,
      })
      .send({ amount: TOKEN_MESSAGE_FEE, mutez: true })

    step('Post Comment', 'Awaiting confirmation...')
    await op.confirmation()
    invalidateToken(fa2Address, tokenId)
    show('Post Comment', 'Comment posted')
    return op.opHash
  } catch (e) {
    const friendly = friendlyError(e)
    showError('Post Comment', friendly)
    throw friendly
  }
}

export async function editComment({
  commentId,
  fa2Address,
  tokenId,
  content,
  parentId,
}: {
  commentId: string
  fa2Address: string
  tokenId: string
  content: string
  parentId?: string
}) {
  const { step, show, showError } = useModalStore.getState()

  step('Edit Comment', 'Uploading to IPFS', true)

  try {
    const payload: TokenCommentPayload = {
      type: 'teia-token-comment',
      version: 1,
      fa2Address,
      tokenId,
      content,
      author: useUserStore.getState().address ?? '',
      timestamp: new Date().toISOString(),
    }
    if (parentId) payload.parentId = parentId

    const contentBytes = await buildContentBytes(payload)

    step('Edit Comment', 'Waiting for wallet confirmation', false)

    const contract = await Tezos.wallet.at(CONTRACT)
    const op = await contract.methodsObject
      .edit_comment({
        comment_id: parseInt(commentId),
        content: contentBytes,
      })
      .send()

    step('Edit Comment', 'Awaiting confirmation...')
    await op.confirmation()
    invalidateToken(fa2Address, tokenId)
    show('Edit Comment', 'Comment updated')
    return op.opHash
  } catch (e) {
    const friendly = friendlyError(e)
    showError('Edit Comment', friendly)
    throw friendly
  }
}

export async function setOwnCommentHidden({
  commentId,
  fa2Address,
  tokenId,
  hidden,
}: {
  commentId: string
  fa2Address: string
  tokenId: string
  hidden: boolean
}) {
  const { step, show, showError } = useModalStore.getState()
  const title = hidden ? 'Hide Comment' : 'Unhide Comment'

  step(title, 'Waiting for wallet', true)

  try {
    const contract = await Tezos.wallet.at(CONTRACT)
    const op = await contract.methodsObject
      .set_own_comment_hidden({
        comment_id: parseInt(commentId),
        hidden,
      })
      .send()

    step(title, 'Awaiting confirmation...')
    await op.confirmation()
    invalidateToken(fa2Address, tokenId)
    show(title, hidden ? 'Comment hidden' : 'Comment restored')
    return op.opHash
  } catch (e) {
    showError(title, e)
    throw e
  }
}
