// On-chain profile card write layer.
//
// Access, enforced on-chain:
//  - anyone, for their own card: set_profile (attaches profile_fee from
//    get_fees, 0 by default)
//  - moderators / multisig users: set_profile_hidden

import { mutate } from 'swr'
import { PROFILES_CONTRACT } from '@constants'
import { Tezos, useUserStore } from '@context/userStore'
import { useModalStore } from '@context/modalStore'
import { buildProfileDocument, uploadProfileContent } from './ipfs'
import type { ProfileDocInput } from './ipfs'

/** SWR key for one address's profile (see ./hooks.ts). */
export const profileKey = (address: string) => `profiles/one/${address}`
/** SWR key for every card, hidden included (moderation console). */
export const PROFILES_MOD_SWR_KEY = 'profiles/mod-all'

const ERRORS: Record<string, string> = {
  PRF_NOT_AUTHORIZED: 'You are not authorized to perform this action.',
  PRF_PROFILE_NOT_FOUND: 'That wallet has no profile card.',
  PRF_INCORRECT_FEE: 'The attached fee does not match the current fee.',
  PRF_PAUSED: 'Profiles are temporarily paused by governance.',
  PRF_EMPTY_CID: 'The profile could not be saved (empty content).',
}

function friendlyError(e: unknown): unknown {
  const raw = JSON.stringify(e ?? '') + String((e as Error)?.message ?? '')
  const code = Object.keys(ERRORS).find((c) => raw.includes(c))
  return code ? new Error(ERRORS[code]) : e
}

/** Read the current profile fee (mutez) from the get_fees view. */
async function getProfileFee(): Promise<number> {
  try {
    const viewCaller = useUserStore.getState().address ?? ''
    const contract = await Tezos.contract.at(PROFILES_CONTRACT)
    const fees = await contract.contractViews
      .get_fees()
      .executeView({ viewCaller })
    return Number(fees.profile_fee ?? 0)
  } catch {
    // View unreachable: assume free (the contract still validates the amount).
    return 0
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
    mutate(PROFILES_MOD_SWR_KEY)
    show(title, done)
    return op.opHash
  } catch (e) {
    const friendly = friendlyError(e)
    showError(title, friendly)
    throw friendly
  }
}

const self = () => useUserStore.getState().address

// --- Own card ---

/** Create or update the connected account's profile card. */
export function setProfile(input: ProfileDocInput) {
  return send(
    'Save Profile Card',
    'Profile card saved',
    'set_profile',
    self(),
    async () => {
      const arg = await uploadProfileContent(buildProfileDocument(input))
      return { arg, amount: await getProfileFee() }
    },
    true
  )
}

// --- Moderator / multisig actions (no fee) ---

export function setProfileHidden({
  address,
  hidden,
}: {
  address: string
  hidden: boolean
}) {
  return send(
    hidden ? 'Hide Profile Card' : 'Unhide Profile Card',
    hidden ? 'Profile card hidden' : 'Profile card restored',
    'set_profile_hidden',
    address,
    async () => ({ arg: { address, hidden } })
  )
}
