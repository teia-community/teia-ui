import { Line } from '@atoms/line'
import { DAO_TREASURY_CONTRACT, MODERATOR_CONTRACT } from '@constants'
import ModeratorManagement from '@components/moderators/ModeratorManagement'
import NewMultisigProposal from './NewMultisigProposal'
import FeeGovernance from './FeeGovernance'
import styles from './ProposeAndVote.module.scss'

/**
 * The one place the core team acts.
 *
 * What the multisig votes on is spread across three contracts: the treasury
 * itself, the contract behind each fee, and the moderator contract. Raising
 * and voting on any of them happens here, so nobody has to know which
 * contract a decision lives in to take part in it.
 */
export default function ProposeAndVote({
  quorum,
  memberCount,
  expirationDays,
  canAct,
}) {
  return (
    <div className={styles.wrap}>
      <p className={styles.intro}>
        Everything the core team can put to a vote is raised here: spending from
        the treasury, the fees each contract charges, who is on the core team,
        and who moderates. Treasury proposals already open are listed under
        Active, where they are voted on.
      </p>

      {!canAct && (
        <p className={styles.note}>
          {'Only core team members can raise or vote on a proposal. '}
          {'Everything below can still be read.'}
        </p>
      )}

      {canAct && (
        <>
          <h2 className={styles.heading}>Treasury and membership</h2>
          <NewMultisigProposal
            quorum={quorum}
            memberCount={memberCount}
            expirationDays={expirationDays}
          />
          <Line />
        </>
      )}

      <h2 className={styles.heading}>Fees</h2>
      <FeeGovernance quorum={quorum} canAct={canAct} />

      <Line />

      <ModeratorManagement
        contract={MODERATOR_CONTRACT}
        multisig={DAO_TREASURY_CONTRACT}
        title="Moderators"
      />
    </div>
  )
}
