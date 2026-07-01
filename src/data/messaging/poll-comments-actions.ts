/**
 * Poll comments contract interactions via Taquito.
 *
 * The contract token-gates posting via an FA2 `balance_of` callback.
 *
 * Comments are stored on IPFS via the messaging gateway; only the ipfs://
 * URI is written on-chain.
 */
import { stringToBytes } from '@taquito/utils'
import { mutate } from 'swr'
import { POLL_COMMENTS_CONTRACT, POLL_MESSAGE_FEE } from '@constants'
import { Tezos, useUserStore } from '@context/userStore'
import { useModalStore } from '@context/modalStore'
import { uploadMsgJsonToIPFS } from './ipfs'
import type { CommentPayload } from './poll-comments-types'

const CONTRACT = POLL_COMMENTS_CONTRACT

/**
 * Map known contract error strings to user-facing messages.
 * Returns the original error untouched if we don't recognize it,
 * so the modal still shows something useful for unexpected failures.
 */
function friendlyError(e: unknown): unknown {
  const raw = JSON.stringify(e ?? '')
  if (raw.includes('USER_BANNED')) {
    return new Error('Sorry, you have been banned from commenting.')
  }
  if (raw.includes('NOT_TOKEN_HOLDER')) {
    return new Error('You need to hold a TEIA token to comment.')
  }
  if (raw.includes('CONTRACT_PAUSED')) {
    return new Error('Comments are temporarily paused by governance.')
  }
  if (raw.includes('PARENT_HIDDEN')) {
    return new Error("Can't reply to a hidden comment.")
  }
  return e
}

function invalidatePoll(pollId: string) {
  mutate(`msg:poll-comments:${CONTRACT}:${pollId}`)
}

async function buildContentBytes(payload: CommentPayload): Promise<string> {
  const ipfsUri = await uploadMsgJsonToIPFS(
    payload as unknown as Record<string, unknown>
  )
  return stringToBytes(ipfsUri)
}

export async function postComment({
  pollId,
  content,
  parentId,
}: {
  pollId: string
  content: string
  parentId?: string
}) {
  const { step, show, showError } = useModalStore.getState()

  step('Post Comment', 'Uploading to IPFS', true)

  try {
    const payload: CommentPayload = {
      type: 'teia-poll-comment',
      version: 1,
      pollId: pollId,
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
        poll_id: parseInt(pollId),
        content: contentBytes,
        parent_id: parentId ? parseInt(parentId) : null,
      })
      .send({ amount: POLL_MESSAGE_FEE, mutez: true })

    step('Post Comment', 'Awaiting confirmation...')
    await op.confirmation()
    invalidatePoll(pollId)
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
  pollId,
  content,
  parentId,
}: {
  commentId: string
  pollId: string
  content: string
  parentId?: string
}) {
  const { step, show, showError } = useModalStore.getState()

  step('Edit Comment', 'Uploading to IPFS', true)

  try {
    const payload: CommentPayload = {
      type: 'teia-poll-comment',
      version: 1,
      pollId,
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
    invalidatePoll(pollId)
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
  pollId,
  hidden,
}: {
  commentId: string
  pollId: string
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
    invalidatePoll(pollId)
    show(title, hidden ? 'Comment hidden' : 'Comment restored')
    return op.opHash
  } catch (e) {
    showError(title, e)
    throw e
  }
}

// ---------------------------------------------------------------------------
// Moderation for multisig users & moderators
// ---------------------------------------------------------------------------

/** Moderator hide/unhide of any comment. */
export async function moderateCommentHidden({
  commentId,
  pollId,
  hidden,
}: {
  commentId: string
  pollId: string
  hidden: boolean
}) {
  const { step, show, showError } = useModalStore.getState()
  const title = hidden ? 'Moderate: Hide' : 'Moderate: Unhide'

  step(title, 'Waiting for wallet', true)

  try {
    const contract = await Tezos.wallet.at(CONTRACT)
    const op = await contract.methodsObject
      .moderate_comment_hidden({
        comment_id: parseInt(commentId),
        hidden,
      })
      .send()

    step(title, 'Awaiting confirmation...')
    await op.confirmation()
    invalidatePoll(pollId)
    show(
      title,
      hidden ? 'Comment hidden by moderator' : 'Comment restored by moderator'
    )
    return op.opHash
  } catch (e) {
    const friendly = friendlyError(e)
    showError(title, friendly)
    throw friendly
  }
}

/** Add or remove an address from the ban list. */
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

    step(title, 'Awaiting confirmation...')
    await op.confirmation()
    show(title, banned ? 'User banned from comments' : 'User unbanned')
    return op.opHash
  } catch (e) {
    const friendly = friendlyError(e)
    showError(title, friendly)
    throw friendly
  }
}

/** Pause or unpause the whole contract. */
export async function setPaused(paused: boolean) {
  const { step, show, showError } = useModalStore.getState()
  const title = paused ? 'Pause Comments' : 'Unpause Comments'

  step(title, 'Waiting for wallet', true)

  try {
    const contract = await Tezos.wallet.at(CONTRACT)
    const op = await contract.methodsObject.set_pause(paused).send()

    step(title, 'Awaiting confirmation...')
    await op.confirmation()
    show(title, paused ? 'Comments paused' : 'Comments resumed')
    return op.opHash
  } catch (e) {
    const friendly = friendlyError(e)
    showError(title, friendly)
    throw friendly
  }
}
