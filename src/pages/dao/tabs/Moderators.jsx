import { MODERATOR_CONTRACT, DAO_TREASURY_CONTRACT } from '@constants'
import { ModeratorManagement } from '@components/moderators'

/** DAO page tab: manage the teia moderators. */
export default function DaoModerators() {
  return (
    <ModeratorManagement
      contract={MODERATOR_CONTRACT}
      multisig={DAO_TREASURY_CONTRACT}
      title="Teia moderators"
    />
  )
}
