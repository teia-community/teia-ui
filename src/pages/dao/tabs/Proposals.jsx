import { useNavigate, useParams } from 'react-router-dom'
import { DAO_GOVERNANCE_CONTRACT } from '@constants'
import { useUserStore } from '@context/userStore'
import { Line } from '@atoms/line'
import {
  useStorage,
  useDaoGovernanceParameters,
  useDaoProposals,
  useDaoRepresentatives,
  useDaoUserVotes,
  useDaoCommunityVotes,
} from '@data/swr'
import TokenHolders from '@components/dao/TokenHolders'
import LoadingDaoMessage from '../LoadingDaoMessage'
import Proposal from '../Proposal'
import styles from '@style'

const PROPOSAL_STATUS_OPTIONS = {
  toVote: 'Proposals to vote',
  voted: 'Already voted proposals',
  toEvaluate: 'Proposals to evaluate',
  approved: 'Approved proposals',
  toExecute: 'Proposals to execute',
  executed: 'Executed proposals',
  rejected: 'Rejected proposals',
  cancelled: 'Cancelled proposals',
}

/** Short labels for the tab row; the long ones belong in the group intro. */
const TAB_LABELS = {
  toVote: 'To vote',
  voted: 'Voted',
  toEvaluate: 'To evaluate',
  approved: 'Approved',
  toExecute: 'To execute',
  executed: 'Executed',
  rejected: 'Rejected',
  cancelled: 'Cancelled',
}

/** Not a proposal status: the electorate that decides them. */
const HOLDERS_TAB = 'holders'

export default function DaoProposals() {
  // The open sub-tab lives in the address, so a view can be linked to.
  const { view } = useParams()
  const navigate = useNavigate()
  const selectedStatus =
    view && (view === HOLDERS_TAB || view in TAB_LABELS) ? view : 'toVote'
  const setSelectedStatus = (next) => navigate(`/dao/proposals/${next}`)

  // Get all the required DAO information
  const [daoStorage] = useStorage(DAO_GOVERNANCE_CONTRACT)
  const [governanceParameters] = useDaoGovernanceParameters(daoStorage)
  const [proposals] = useDaoProposals(daoStorage)
  const [representatives] = useDaoRepresentatives(daoStorage)

  // Get all the required user information
  const userAddress = useUserStore((st) => st.address)
  const userCommunity = representatives?.[userAddress]
  const [userVotes] = useDaoUserVotes(userAddress, daoStorage)
  const [userCommunityVotes] = useDaoCommunityVotes(userCommunity, daoStorage)

  // Display the loading page information until all data is available
  if (!governanceParameters || !proposals || !representatives) {
    return <LoadingDaoMessage />
  }

  // Separate the proposal ids depending of their current status
  const proposalIdsByStatus = Object.fromEntries(
    Object.keys(PROPOSAL_STATUS_OPTIONS).map((status) => [status, []])
  )
  const now = new Date()

  for (const proposalId of Object.keys(proposals).reverse()) {
    // Calculate the proposal vote and wait expiration times
    const proposal = proposals[proposalId]
    const gp = governanceParameters[proposal.gp_index]
    const votePeriod = parseInt(gp.vote_period)
    const waitPeriod = parseInt(gp.wait_period)
    const voteExpirationTime = new Date(proposal.timestamp)
    voteExpirationTime.setDate(voteExpirationTime.getDate() + votePeriod)
    const waitExpirationTime = new Date(proposal.timestamp)
    waitExpirationTime.setDate(
      waitExpirationTime.getDate() + votePeriod + waitPeriod
    )

    // Classify the proposal according to their status
    if (proposal.status.open) {
      if (now > voteExpirationTime) {
        proposalIdsByStatus.toEvaluate.push(proposalId)
      } else if (userVotes?.[proposalId]) {
        if (userCommunity && !userCommunityVotes?.[proposalId]) {
          proposalIdsByStatus.toVote.push(proposalId)
        } else {
          proposalIdsByStatus.voted.push(proposalId)
        }
      } else {
        proposalIdsByStatus.toVote.push(proposalId)
      }
    } else if (proposal.status.approved) {
      if (now > waitExpirationTime) {
        proposalIdsByStatus.toExecute.push(proposalId)
      } else {
        proposalIdsByStatus.approved.push(proposalId)
      }
    } else if (proposal.status.executed) {
      proposalIdsByStatus.executed.push(proposalId)
    } else if (proposal.status.rejected) {
      proposalIdsByStatus.rejected.push(proposalId)
    } else if (proposal.status.cancelled) {
      proposalIdsByStatus.cancelled.push(proposalId)
    }
  }

  // Decide which proposal group can be selected
  const statusToSelect = Object.keys(PROPOSAL_STATUS_OPTIONS).filter(
    (status) => status === 'toVote' || proposalIdsByStatus[status].length > 0
  )

  return (
    <section className={styles.section}>
      <h1 className={styles.section_title}>Teia DAO proposals</h1>

      <p className={styles.dao_intro}>
        A DAO proposal is a vote of the whole organisation, weighted by TEIA
        tokens and open to every holder. It is the highest authority in Teia:
        its outcome binds every part of the organisation, the core team multisig
        included.
      </p>
      <p className={styles.dao_intro}>
        Teia is incorporated as Teia DAO LLC, a non-profit limited liability
        company registered in the Republic of the Marshall Islands. TEIA token
        holders are its operating members, holding the standing that
        shareholders hold in a conventional company, and a DAO proposal is how
        that membership exercises it.
      </p>
      <p className={styles.dao_intro}>
        The core team handles day-to-day operations &mdash; budgets, grants,
        events, and the work of keeping teia.art running &mdash; through its own
        multisig, within the mandate the DAO sets here. Those decisions are
        listed under Multisig Proposals.
      </p>

      <div className={styles.proposal_tabs}>
        {statusToSelect.map((status) => (
          <button
            type="button"
            key={status}
            className={`${styles.proposal_tab} ${
              selectedStatus === status ? styles.proposal_tab_active : ''
            }`}
            onClick={() => setSelectedStatus(status)}
          >
            {TAB_LABELS[status]}
            <small>{proposalIdsByStatus[status].length}</small>
          </button>
        ))}
        <button
          type="button"
          className={`${styles.proposal_tab} ${
            selectedStatus === HOLDERS_TAB ? styles.proposal_tab_active : ''
          }`}
          onClick={() => setSelectedStatus(HOLDERS_TAB)}
        >
          Token holders
        </button>
      </div>

      {selectedStatus === HOLDERS_TAB ? (
        <TokenHolders limit={50} title="TEIA token holders" />
      ) : (
        <ProposalGroup
          status={selectedStatus}
          proposalIds={proposalIdsByStatus[selectedStatus]}
        />
      )}
    </section>
  )
}

function ProposalGroup({ status, proposalIds }) {
  const groupIntroduction = (() => {
    switch (status) {
      case 'toVote':
        return proposalIds.length > 0
          ? "These proposals are still in the voting phase and you didn't vote for them yet."
          : 'There are no new proposals to vote at the moment.'
      case 'voted':
        return 'These proposals are still in the voting phase, but you already voted them.'
      case 'toEvaluate':
        return 'The voting period for these proposals has finished. You can evaluate their result to see if they are approved or rejected.'
      case 'approved':
        return 'These are approved proposals that are still in the waiting phase. Once the waiting phase finishes, you will be able to execute them.'
      case 'toExecute':
        return 'These proposals have been approved by the DAO and can be exectuded.'
      case 'executed':
        return 'These proposals have been executed already.'
      case 'rejected':
        return "These proposals didn't reach the required quorum and/or supermajority. As a result, they were rejected by the DAO."
      case 'cancelled':
        return 'These proposals were cancelled by the proposal issuer or the DAO guardians.'
      default:
        return ''
    }
  })()

  return (
    <>
      <p>{groupIntroduction}</p>

      {proposalIds.length > 0 && (
        <ul>
          {proposalIds.map((proposalId, index) => (
            <li key={proposalId}>
              <Proposal proposalId={proposalId} />

              {index < proposalIds.length - 1 && <Line />}
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
