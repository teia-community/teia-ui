// On-chain profile registry write layer.
//
// Access, enforced on-chain:
//  - anyone, for their own profile: set_profile, claim_handle, release_handle
//    (set_profile and claim_handle attach their fee from get_fees, 0 by
//    default)
//  - moderators / multisig users: set_profile_moderated, set_handle_blocked

import { mutate } from 'swr'
import { PROFILES_CONTRACT } from '@constants'
import { Tezos, useUserStore } from '@context/userStore'
import { useModalStore } from '@context/modalStore'
import { buildProfileDocument, uploadProfileContent } from './ipfs'
import type { ProfileDocInput } from './ipfs'

/** SWR key for one address's profile (see ./hooks.ts). */
export const profileKey = (address: string) => `profiles/one/${address}`

/** A handle is 1-32 characters from a-z, 0-9, "_" and "-" (as on-chain). */
export const HANDLE_PATTERN = /^[a-z0-9_-]{1,32}$/
export const isValidHandle = (handle: string) => HANDLE_PATTERN.test(handle)

const ERRORS: Record<string, string> = {
  PRF_NOT_AUTHORIZED: 'You are not authorized to perform this action.',
  PRF_PROFILE_NOT_FOUND: 'Save your profile first, then claim a handle.',
  PRF_INVALID_HANDLE:
    'A handle is 1 to 32 characters: lowercase letters, numbers, "_" and "-".',
  PRF_HANDLE_TAKEN: 'That handle is already taken.',
  PRF_HANDLE_BLOCKED: 'That handle is reserved and cannot be claimed.',
  PRF_NO_HANDLE: 'You have no handle to release.',
  PRF_INCORRECT_FEE: 'The attached fee does not match the current fee.',
  PRF_PAUSED: 'Profiles are temporarily paused by governance.',
  PRF_EMPTY_CID: 'The profile could not be saved (empty content).',
}

function friendlyError(e: unknown): unknown {
  const raw = JSON.stringify(e ?? '') + String((e as Error)?.message ?? '')
  const code = Object.keys(ERRORS).find((c) => raw.includes(c))
  return code ? new Error(ERRORS[code]) : e
}

/** Read the current per-action fees (mutez) from the get_fees view. */
async function getFees(): Promise<{ profileFee: number; handleFee: number }> {
  try {
    const viewCaller = useUserStore.getState().address ?? ''
    const contract = await Tezos.contract.at(PROFILES_CONTRACT)
    const fees = await contract.contractViews
      .get_fees()
      .executeView({ viewCaller })
    return {
      profileFee: Number(fees.profile_fee ?? 0),
      handleFee: Number(fees.handle_fee ?? 0),
    }
  } catch {
    // View unreachable: assume free (the contract still validates the amount).
    return { profileFee: 0, handleFee: 0 }
  }
}

/**
 * Shared modal + confirmation flow for every entrypoint call. `prepare` runs
 * the off-chain part (IPFS upload, fee lookup) and returns the entrypoint
 * argument and the tez to attach. `affected` is the address whose cached
 * profile the call changes.
 */
async function send(
  title: string,
  done: string,
  entrypoint: string,
  affected: string | undefined,
  prepare: () => Promise<{ arg?: unknown; amount?: number }>,
  uploads = false
) {
  const { step, show, showError } = useModalStore.getState()
  step(title, uploads ? 'Uploading to IPFS' : 'Waiting for wallet', true)
  try {
    const { arg, amount = 0 } = await prepare()
    if (uploads) step(title, 'Waiting for wallet confirmation', false)
    const contract = await Tezos.wallet.at(PROFILES_CONTRACT)
    const op = await contract.methodsObject[entrypoint](arg).send({
      amount,
      mutez: true,
    })
    step(title, 'Awaiting confirmation...')
    await op.confirmation()
    if (affected) mutate(profileKey(affected))
    show(title, done)
    return op.opHash
  } catch (e) {
    const friendly = friendlyError(e)
    showError(title, friendly)
    throw friendly
  }
}

const self = () => useUserStore.getState().address

// --- Own profile ---

/** Create or update the connected account's profile. */
export function setProfile(input: ProfileDocInput) {
  return send(
    'Save Profile',
    'Profile saved',
    'set_profile',
    self(),
    async () => {
      const arg = await uploadProfileContent(buildProfileDocument(input))
      return { arg, amount: (await getFees()).profileFee }
    },
    true
  )
}

/** Claim a handle for the connected account (releases any previous one). */
export function claimHandle(handle: string) {
  return send(
    'Claim Handle',
    `You are now @${handle}`,
    'claim_handle',
    self(),
    async () => {
      if (!isValidHandle(handle)) throw new Error(ERRORS.PRF_INVALID_HANDLE)
      return { arg: handle, amount: (await getFees()).handleFee }
    }
  )
}

/** Give up the connected account's handle. */
export function releaseHandle() {
  return send(
    'Release Handle',
    'Handle released',
    'release_handle',
    self(),
    async () => ({})
  )
}

// --- Moderator / multisig actions (no fee) ---

export function setProfileModerated({
  address,
  moderated,
}: {
  address: string
  moderated: boolean
}) {
  return send(
    moderated ? 'Moderate Profile' : 'Restore Profile',
    moderated ? 'Profile hidden from public views' : 'Profile restored',
    'set_profile_moderated',
    address,
    async () => ({ arg: { address, moderated } })
  )
}

/**
 * Block or unblock a handle. Blocking a claimed handle also releases it from
 * its owner; pass that owner as `owner` so their cached profile refreshes.
 */
export function setHandleBlocked({
  handle,
  blocked,
  owner,
}: {
  handle: string
  blocked: boolean
  owner?: string
}) {
  return send(
    blocked ? 'Block Handle' : 'Unblock Handle',
    blocked ? `@${handle} blocked` : `@${handle} unblocked`,
    'set_handle_blocked',
    owner,
    async () => ({ arg: { handle, blocked } })
  )
}
