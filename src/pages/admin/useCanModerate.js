import { useUserStore } from '@context/userStore'
import { useGateRoles } from '@data/roles'

/**
 * Whether the connected account may use the moderation tools — i.e. it is a
 * DAO multisig member or listed in the moderator contract. Delegates to
 * useGateRoles so all moderation gating shares one resolution path (including
 * the dev-only VITE_MOCK_ROLES override). `resolved` is false until roles have
 * loaded, so callers can avoid flashing a denial.
 */
export function useCanModerate() {
  const address = useUserStore((st) => st.address)
  const { data } = useGateRoles(address)

  return {
    canModerate: Boolean(data?.canModerate),
    resolved: data !== undefined,
  }
}
