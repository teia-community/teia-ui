// Wiki role detection 

import {
  fetchModerators,
  fetchMultisigUsers,
  fetchTokenBalance,
} from '@data/roles'
import type { WikiUserRoles } from './types'

const EMPTY_ROLES: WikiUserRoles = {
  isModerator: false,
  isMultisig: false,
  canModerate: false,
  canPropose: false,
}

/**
 * Dev/testing override (UI ONLY, this will be removed with a future commit).
 * This lets you exercise the admijn UI with a wallet that isn't actually a multisig user. On-chain approve/reject will
 * still be rejected.
 *
 * Enable any of these in the console:
 *   localStorage.setItem('wiki_dev_force_moderate', '1')   // force current wallet
 *   localStorage.setItem('wiki_dev_moderators', 'tz1aaa,tz1bbb')  // by address
 *   VITE_WIKI_DEV_MODERATORS=tz1aaa,tz1bbb  (in .env)
 * Then reload the page.
 */
export function devModerateOverride(address?: string): boolean {
  try {
    if (localStorage.getItem('wiki_dev_force_moderate') === '1') return true
    const fromLs = localStorage.getItem('wiki_dev_moderators') || ''
    const fromEnv = import.meta.env.VITE_WIKI_DEV_MODERATORS || ''
    const list = `${fromLs},${fromEnv}`
      .split(',')
      .map((a) => a.trim())
      .filter(Boolean)
    return Boolean(address && list.includes(address))
  } catch {
    return false
  }
}

/** Resolve the current user's wiki capabilities. Returns no-access if unsynced. */
export async function fetchUserRoles(
  address?: string
): Promise<WikiUserRoles> {
  const devModerate = devModerateOverride(address)

  if (!address) {
    return devModerate
      ? { isModerator: true, isMultisig: true, canModerate: true, canPropose: false }
      : EMPTY_ROLES
  }

  const [users, moderators, balance] = await Promise.all([
    fetchMultisigUsers().catch(() => [] as string[]),
    fetchModerators().catch(() => [] as string[]),
    fetchTokenBalance(address).catch(() => 0),
  ])

  const isMultisig = users.includes(address)
  const isModerator = moderators.includes(address)
  const canModerate = isMultisig || isModerator || devModerate

  return {
    isModerator: isModerator || devModerate,
    isMultisig: isMultisig || devModerate,
    canModerate,
    canPropose: balance > 0,
  }
}
