import { useUserStore } from '@context/userStore'
import { useMultisigUsers, useModerators } from '@data/roles'

/**
 * Whether the connected account may use the moderation tools — i.e. it is a
 * DAO multisig member or listed in the moderator contract. `resolved` is false
 * until both role lists have loaded (so callers can avoid flashing a denial).
 */
export function useCanModerate() {
  const address = useUserStore((st) => st.address)
  const { data: users } = useMultisigUsers()
  const { data: moderators } = useModerators()

  const resolved = users !== undefined && moderators !== undefined
  const canModerate = Boolean(
    address &&
      ((users?.includes(address) ?? false) ||
        (moderators?.includes(address) ?? false))
  )

  return { canModerate, resolved }
}
