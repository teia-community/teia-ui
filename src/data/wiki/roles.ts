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

/** Resolve the current user's wiki capabilities. Returns no-access if unsynced. */
export async function fetchUserRoles(address?: string): Promise<WikiUserRoles> {
  if (!address) return EMPTY_ROLES

  const [users, moderators, balance] = await Promise.all([
    fetchMultisigUsers().catch(() => [] as string[]),
    fetchModerators().catch(() => [] as string[]),
    fetchTokenBalance(address).catch(() => 0),
  ])

  const isMultisig = users.includes(address)
  const isModerator = moderators.includes(address)
  const canModerate = isMultisig || isModerator

  return {
    isModerator,
    isMultisig,
    canModerate,
    canPropose: balance > 0,
  }
}
