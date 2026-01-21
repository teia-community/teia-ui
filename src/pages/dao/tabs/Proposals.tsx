import { useState } from 'react'
import { DAO_GOVERNANCE_CONTRACT } from '@constants'
import { useUserStore } from '@context/userStore'
import { Line } from '@atoms/line'
import { Select } from '@atoms/select'
import {
  useStorage,
  useDaoGovernanceParameters,
  useDaoProposals,
  useDaoRepresentatives,
  useDaoUserVotes,
  useDaoCommunityVotes,
} from '@data/swr'
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

export default function DaoProposals() {
  // Set the component state
  const [selectedStatus, setSelectedStatus] = useState('toVote')

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
  const proposalIdsByStatus: Record<string, string[]> = Object.fromEntries(
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

      <Select
        alt="proposal group selection"
        value={{
          value: selectedStatus,
          label: `${PROPOSAL_STATUS_OPTIONS[selectedStatus]} (${proposalIdsByStatus[selectedStatus].length})`,
        }}
        onChange={(e) => setSelectedStatus(e.value)}
        options={statusToSelect.map((status) => ({
          value: status,
          label: `${PROPOSAL_STATUS_OPTIONS[status]} (${proposalIdsByStatus[status].length})`,
        }))}
      >
        <Line />
      </Select>

      <ProposalGroup
        status={selectedStatus}
        proposalIds={proposalIdsByStatus[selectedStatus]}
      />
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
