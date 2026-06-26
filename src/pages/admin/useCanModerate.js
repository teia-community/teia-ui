import { useUserStore } from '@context/userStore'
import { useMultisigUsers, useModerators } from '@data/roles'
// DEV/TESTING override (UI only) — reuses the wiki's flags. Remove with the
// wiki override before shipping.
import { devModerateOverride } from '@data/wiki/roles'

/**
 * Under construction
 */
export function useCanModerate() {
  const address = useUserStore((st) => st.address)
  const { data: users } = useMultisigUsers()
  const { data: moderators } = useModerators()

  const devOverride = devModerateOverride(address)
  const resolved =
    devOverride || (users !== undefined && moderators !== undefined)
  const canModerate =
    devOverride ||
    Boolean(
      address &&
        ((users?.includes(address) ?? false) ||
          (moderators?.includes(address) ?? false))
    )

  return { canModerate, resolved }
}
