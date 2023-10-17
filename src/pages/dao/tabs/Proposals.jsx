import { useState } from 'react'
import { bytes2Char } from '@taquito/utils'
import { DAO_GOVERNANCE_CONTRACT, DAO_TOKEN_DECIMALS, TOKENS } from '@constants'
import { useUserStore } from '@context/userStore'
import { useDaoStore } from '@context/daoStore'
import { Button } from '@atoms/button'
import { Line } from '@atoms/line'
import { Select } from '@atoms/select'
import {
  TeiaUserLink,
  TezosAddressLink,
  TokenLink,
  IpfsLink,
} from '@atoms/link'
import {
  TezTansfersDetails,
  TokenTansfersDetails,
  CodeDetails,
} from '@components/proposal-details'
import { Votes } from '@components/votes'
import {
  useStorage,
  useDaoGovernanceParameters,
  useDaoProposals,
  useDaoRepresentatives,
  useDaoTokenBalance,
  useDaoUserVotes,
  useDaoCommunityVotes,
  useDaoUsersAliases,
} from '@data/swr'
import { getWordDate } from '@utils/time'
import { parseLambda } from '@utils/lambda'
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

  // Separate the proposals depending of their current status
  const proposalsByStatus = Object.fromEntries(
    Object.keys(PROPOSAL_STATUS_OPTIONS).map((status) => [status, []])
  )

  if (governanceParameters && proposals) {
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

      // Save all the information inside the proposal
      proposal.id = proposalId
      proposal.voteExpirationTime = voteExpirationTime
      proposal.waitExpirationTime = waitExpirationTime
      proposal.voteFinished = now > voteExpirationTime
      proposal.waitFinished = now > waitExpirationTime

      // Classify the proposal according to their status
      if (proposal.status.open) {
        if (proposal.voteFinished) {
          proposalsByStatus.toEvaluate.push(proposal)
        } else if (userVotes?.[proposalId]) {
          if (userCommunity && !userCommunityVotes?.[proposalId]) {
            proposalsByStatus.toVote.push(proposal)
          } else {
            proposalsByStatus.voted.push(proposal)
          }
        } else {
          proposalsByStatus.toVote.push(proposal)
        }
      } else if (proposal.status.approved) {
        if (proposal.waitFinished) {
          proposalsByStatus.toExecute.push(proposal)
        } else {
          proposalsByStatus.approved.push(proposal)
        }
      } else if (proposal.status.executed) {
        proposalsByStatus.executed.push(proposal)
      } else if (proposal.status.rejected) {
        proposalsByStatus.rejected.push(proposal)
      } else if (proposal.status.cancelled) {
        proposalsByStatus.cancelled.push(proposal)
      }
    }
  }

  // Decide which proposal groups can be selected
  const statusToSelect = Object.keys(PROPOSAL_STATUS_OPTIONS).filter(
    (status) => status === 'toVote' || proposalsByStatus[status].length > 0
  )

  return (
    <section className={styles.section}>
      <h1 className={styles.section_title}>Teia DAO proposals</h1>

      <Select
        alt="proposal group selection"
        value={{
          value: selectedStatus,
          label: `${PROPOSAL_STATUS_OPTIONS[selectedStatus]} (${proposalsByStatus[selectedStatus].length})`,
        }}
        onChange={(e) => setSelectedStatus(e.value)}
        options={statusToSelect.map((status) => ({
          value: status,
          label: `${PROPOSAL_STATUS_OPTIONS[status]} (${proposalsByStatus[status].length})`,
        }))}
      >
        <Line />
      </Select>

      <ProposalGroup
        status={selectedStatus}
        proposals={proposalsByStatus[selectedStatus]}
      />
    </section>
  )
}

function ProposalGroup({ status, proposals }) {
  switch (status) {
    case 'toVote':
      return (
        <>
          {proposals.length > 0 ? (
            <p>
              These proposals are still in the voting phase and you didn't vote
              for them yet.
            </p>
          ) : (
            <p>There are no new proposals to vote at the moment.</p>
          )}
          <ProposalList proposals={proposals} canVote canCancel />
        </>
      )
    case 'voted':
      return (
        <>
          <p>
            These proposals are still in the voting phase, but you already voted
            them.
          </p>
          <ProposalList proposals={proposals} canCancel />
        </>
      )
    case 'toEvaluate':
      return (
        <>
          <p>
            The voting period for these proposals has finished. You can evaluate
            their result to see if they are approved or rejected.
          </p>
          <ProposalList proposals={proposals} canCancel canEvaluate />
        </>
      )
    case 'approved':
      return (
        <>
          <p>
            These are approved proposals that are still in the waiting phase.
            Once the waiting phase finishes, you will be able to execute them.
          </p>
          <ProposalList proposals={proposals} canCancel />
        </>
      )
    case 'toExecute':
      return (
        <>
          <p>
            These proposals have been approved by the DAO and can be exectuded.
          </p>
          <ProposalList proposals={proposals} canCancel canExecute />
        </>
      )
    case 'executed':
      return (
        <>
          <p>These proposals have been executed already.</p>
          <ProposalList proposals={proposals} />
        </>
      )
    case 'rejected':
      return (
        <>
          <p>
            These proposals didn't reach the required quorum and/or
            supermajority. As a result, they were rejected by the DAO.
          </p>
          <ProposalList proposals={proposals} />
        </>
      )
    case 'cancelled':
      return (
        <>
          <p>
            These proposals were cancelled by the proposal issuer or the DAO
            guardians.
          </p>
          <ProposalList proposals={proposals} />
        </>
      )
    default:
      return
  }
}

function ProposalList({ proposals, ...actions }) {
  if (proposals.length !== 0) {
    return (
      <ul>
        {proposals.map((proposal, index) => (
          <li key={index}>
            <div className={styles.proposal}>
              <div>
                <ProposalDescription proposal={proposal} />
                <ProposalVotesSummary proposal={proposal} />
              </div>
              <ProposalActions proposal={proposal} {...actions} />
            </div>
            {index !== proposals.length - 1 && <Line />}
          </li>
        ))}
      </ul>
    )
  }
}

function ProposalDescription({ proposal }) {
  // Get all the required DAO information
  const [daoStorage] = useStorage(DAO_GOVERNANCE_CONTRACT)
  const [proposals] = useDaoProposals(daoStorage)
  const [representatives] = useDaoRepresentatives(daoStorage)

  // Get all the required user information
  const userAddress = useUserStore((st) => st.address)

  // Get all the relevant users aliases
  const [usersAliases] = useDaoUsersAliases(
    userAddress,
    representatives,
    proposals
  )

  // Try to extract an ipfs cid from the proposal description
  const description = bytes2Char(proposal.description)
  const cid = description.split('//')[1]

  return (
    <div>
      <h3 className={styles.proposal_title}>
        <span className={styles.proposal_id}>#{proposal.id}</span>
        {bytes2Char(proposal.title)}
      </h3>

      <p>
        Proposed by{' '}
        <TeiaUserLink
          address={proposal.issuer}
          alias={usersAliases?.[proposal.issuer]}
          shorten
        />{' '}
        on {getWordDate(proposal.timestamp)}.
      </p>

      {proposal.status.open &&
        (!proposal.voteFinished ? (
          <p>
            Voting period ends on {getWordDate(proposal.voteExpirationTime)}.
          </p>
        ) : (
          !proposal.waitFinished && (
            <p>
              Waiting period ends on {getWordDate(proposal.waitExpirationTime)}.
            </p>
          )
        ))}

      <p>
        Description:{' '}
        {cid ? <IpfsLink cid={cid}>Open file in ipfs</IpfsLink> : description}
      </p>

      <ProposalContent content={proposal.kind} aliases={usersAliases} />
    </div>
  )
}

function ProposalContent({ content, aliases }) {
  if (content.text) {
    return <p>Effect: Approves a text proposal.</p>
  } else if (content.transfer_mutez) {
    // Calculate the total amount of tez to transfer
    const transfers = content.transfer_mutez
    const totalAmount = transfers.reduce(
      (previous, current) => previous + current.amount / 1e6,
      0
    )

    if (transfers.length === 1) {
      return (
        <p>
          Effect: Transfers {totalAmount} tez to{' '}
          <TezosAddressLink
            address={transfers[0].destination}
            alias={aliases?.[transfers[0].destination]}
            shorten
          />
          .
        </p>
      )
    } else {
      return (
        <>
          <p>Effect: Transfers {totalAmount} tez.</p>
          <TezTansfersDetails
            label="See transfer details"
            transfers={transfers}
            aliases={aliases}
          />
        </>
      )
    }
  } else if (content.transfer_token) {
    // Calculate the total number of token editions to transfer
    const fa2 = content.transfer_token.fa2
    const tokenId = content.transfer_token.token_id
    const token = TOKENS.find((token) => token.fa2 === fa2)
    const decimals = token?.decimals ?? 1
    const transfers = content.transfer_token.distribution
    const nEditions = transfers.reduce(
      (previous, current) => previous + current.amount / decimals,
      0
    )

    if (transfers.length === 1) {
      return (
        <p>
          Effect: Transfers {nEditions}{' '}
          {(!token || token.multiasset) &&
            `edition${nEditions === 1 ? '' : 's'} of `}
          <TokenLink fa2={fa2} id={tokenId} /> to{' '}
          <TezosAddressLink
            address={transfers[0].destination}
            alias={aliases?.[transfers[0].destination]}
            shorten
          />
          .
        </p>
      )
    } else {
      return (
        <>
          <p>
            Effect: Transfers {nEditions}{' '}
            {(!token || token.multiasset) &&
              `edition${nEditions === 1 ? '' : 's'} of `}
            <TokenLink fa2={fa2} id={tokenId} />.
          </p>
          <TokenTansfersDetails
            label="See transfer details"
            fa2={fa2}
            transfers={transfers}
            aliases={aliases}
          />
        </>
      )
    }
  } else {
    return (
      <>
        <p>Effect: Executes a lambda function.</p>
        <CodeDetails
          label="See Micheline code"
          code={parseLambda(content.lambda_function)}
        />
      </>
    )
  }
}

function ProposalVotesSummary({ proposal }) {
  // Get all the required DAO information
  const [daoStorage] = useStorage(DAO_GOVERNANCE_CONTRACT)
  const [governanceParameters] = useDaoGovernanceParameters(daoStorage)
  const [representatives] = useDaoRepresentatives(daoStorage)

  // Get all the required user information
  const userAddress = useUserStore((st) => st.address)
  const userCommunity = representatives?.[userAddress]
  const [userTokenBalance] = useDaoTokenBalance(userAddress)
  const [userVotes] = useDaoUserVotes(userAddress, daoStorage)
  const [userCommunityVotes] = useDaoCommunityVotes(userCommunity, daoStorage)

  // Get the proposal governance parameters
  const gp = governanceParameters[proposal.gp_index]
  const supermajority = gp.supermajority / 100
  const quorum = proposal.quorum
  const voteScaling = gp.vote_method.linear
    ? DAO_TOKEN_DECIMALS
    : Math.pow(DAO_TOKEN_DECIMALS, 0.5)

  // Calculate the weight in votes of a single representative
  const representativesVotes = proposal.representatives_votes
  const representativeShare =
    representativesVotes.total > 0
      ? Math.min(
          gp.representatives_share / representativesVotes.total,
          gp.representative_max_share
        ) / 100
      : 0
  const representativeWeight = quorum * representativeShare

  // Calculate the sum of the token and representatives votes
  const tokenVotes = proposal.token_votes
  const totalVotes =
    parseInt(tokenVotes.total) +
    representativesVotes.total * representativeWeight
  const positiveVotes =
    parseInt(tokenVotes.positive) +
    representativesVotes.positive * representativeWeight
  const negativeVotes =
    parseInt(tokenVotes.negative) +
    representativesVotes.negative * representativeWeight
  const abstainVotes =
    parseInt(tokenVotes.abstain) +
    representativesVotes.abstain * representativeWeight

  // Check if the proposal passes the quorum and supermajority
  const passesQuorum = totalVotes > quorum
  const passesSupermajority =
    positiveVotes > Math.floor((positiveVotes + negativeVotes) * supermajority)

  // Calculate the number of votes needed to reach the quorum
  const requiredVotesForQuorum = passesQuorum ? 0 : quorum - totalVotes

  // Calculate the number of yes votes needed to reach supermajority
  const requiredYesVotesForSupermajority = passesSupermajority
    ? 0
    : totalVotes === 0
    ? voteScaling
    : (negativeVotes * supermajority) / (1 - supermajority) - positiveVotes

  // Check if the user is a DAO member
  const isDaoMember = userTokenBalance > 0

  // Get the user votes and weights
  const userVote = userVotes?.[proposal.id]?.vote
  const userVoteWeight = userVotes?.[proposal.id]?.weight
  const userCommunityVote = userCommunityVotes?.[proposal.id]

  return (
    <div>
      <p>Token votes:</p>
      <Votes
        votes={{
          yes: tokenVotes.positive / voteScaling,
          no: tokenVotes.negative / voteScaling,
          abstain: tokenVotes.abstain / voteScaling,
        }}
      />

      <p>Representatives votes:</p>
      <Votes
        votes={{
          yes:
            (representativesVotes.positive * representativeWeight) /
            voteScaling,
          no:
            (representativesVotes.negative * representativeWeight) /
            voteScaling,
          abstain:
            (representativesVotes.abstain * representativeWeight) / voteScaling,
        }}
      />

      <p>Combined votes:</p>
      <Votes
        votes={{
          yes: positiveVotes / voteScaling,
          no: negativeVotes / voteScaling,
          abstain: abstainVotes / voteScaling,
        }}
      />

      <p>
        Passes supermajority condition?{' '}
        {passesSupermajority
          ? 'Yes.'
          : `No, ${Math.ceil(
              requiredYesVotesForSupermajority / voteScaling
            )} yes votes still missing.`}
      </p>

      <p>
        Passes minimum quorum condition?{' '}
        {passesQuorum
          ? 'Yes.'
          : `No, ${Math.ceil(
              requiredVotesForQuorum / voteScaling
            )} votes still missing.`}
      </p>

      {(isDaoMember ||
        userCommunity ||
        (userVotes && Object.keys(userVotes).length > 0)) && (
        <p>
          Your votes:
          <span className={styles.user_vote}>
            <Votes
              votes={{
                yes: userVote?.yes ? userVoteWeight / voteScaling : 0,
                no: userVote?.no ? userVoteWeight / voteScaling : 0,
                abstain: userVote?.abstain ? userVoteWeight / voteScaling : 0,
              }}
            />
          </span>
          {userCommunity && (
            <span className={styles.user_vote}>
              <Votes
                votes={{
                  yes: userCommunityVote?.yes
                    ? representativeWeight / voteScaling
                    : 0,
                  no: userCommunityVote?.no
                    ? representativeWeight / voteScaling
                    : 0,
                  abstain: userCommunityVote?.abstain
                    ? representativeWeight / voteScaling
                    : 0,
                }}
              />
            </span>
          )}
        </p>
      )}
    </div>
  )
}

function ProposalActions({
  proposal,
  canVote,
  canCancel,
  canEvaluate,
  canExecute,
}) {
  // Get all the required DAO information
  const [daoStorage] = useStorage(DAO_GOVERNANCE_CONTRACT)
  const [governanceParameters] = useDaoGovernanceParameters(daoStorage)
  const [, updateProposals] = useDaoProposals(daoStorage)
  const [representatives] = useDaoRepresentatives(daoStorage)

  // Get all the required user information
  const userAddress = useUserStore((st) => st.address)
  const userCommunity = representatives?.[userAddress]
  const [userTokenBalance, updateUserTokenBalance] =
    useDaoTokenBalance(userAddress)
  const [userVotes, updateUserVotes] = useDaoUserVotes(userAddress, daoStorage)
  const [communityVotes, updateCommunityVotes] = useDaoCommunityVotes(
    userCommunity,
    daoStorage
  )

  // Get the contract call methods from the DAO store
  const voteProposal = useDaoStore((st) => st.voteProposal)
  const voteProposalAsRepresentative = useDaoStore(
    (st) => st.voteProposalAsRepresentative
  )
  const cancelProposal = useDaoStore((st) => st.cancelProposal)
  const evaluateVotingResult = useDaoStore((st) => st.evaluateVotingResult)
  const executeProposal = useDaoStore((st) => st.executeProposal)

  // Check if the user is a DAO member
  const isDaoMember = userTokenBalance > 0

  // Check if the user can vote proposals
  const userCanVote =
    userTokenBalance >=
    governanceParameters[proposal.gp_index].min_amount / DAO_TOKEN_DECIMALS

  // Define the callback function to be triggered when the user interacts
  const callback = () => {
    updateProposals()
    updateUserTokenBalance()
    updateUserVotes()
    updateCommunityVotes()
  }

  // Decide which buttons will be displayed
  const id = proposal.id
  const showVoteButtons = canVote && userCanVote && !userVotes?.[id]
  const showRepresentativeVoteButtons =
    canVote && userCommunity && !communityVotes?.[id]
  const showEvaluateButton = canEvaluate && isDaoMember
  const showExecuteButton = canExecute && isDaoMember
  const showCancelButton =
    canCancel &&
    (proposal.issuer === userAddress || daoStorage?.guardians === userAddress)

  if (
    showVoteButtons ||
    showRepresentativeVoteButtons ||
    showEvaluateButton ||
    showExecuteButton ||
    showCancelButton
  ) {
    return (
      <div>
        {showVoteButtons && (
          <div>
            <p>Vote with your tokens:</p>
            <div className={styles.proposal_buttons}>
              <Button
                onClick={() => voteProposal(id, 'yes', null, callback)}
                shadow_box
                fit
              >
                yes
              </Button>
              <Button
                onClick={() => voteProposal(id, 'no', null, callback)}
                shadow_box
                fit
              >
                no
              </Button>
              <Button
                onClick={() => voteProposal(id, 'abstain', null, callback)}
                shadow_box
                fit
              >
                abstain
              </Button>
            </div>
          </div>
        )}

        {showRepresentativeVoteButtons && (
          <div>
            <p>Vote as representative:</p>
            <div className={styles.proposal_buttons}>
              <Button
                onClick={() =>
                  voteProposalAsRepresentative(id, 'yes', callback)
                }
                shadow_box
                fit
              >
                yes
              </Button>
              <Button
                onClick={() => voteProposalAsRepresentative(id, 'no', callback)}
                shadow_box
                fit
              >
                no
              </Button>
              <Button
                onClick={() =>
                  voteProposalAsRepresentative(id, 'abstain', callback)
                }
                shadow_box
                fit
              >
                abstain
              </Button>
            </div>
          </div>
        )}

        {showEvaluateButton && (
          <div>
            <p>Evaluate the proposal:</p>
            <div className={styles.proposal_buttons}>
              <Button
                onClick={() => evaluateVotingResult(id, callback)}
                shadow_box
                fit
              >
                evaluate
              </Button>
            </div>
          </div>
        )}

        {showExecuteButton && (
          <div>
            <p>Execute the proposal:</p>
            <div className={styles.proposal_buttons}>
              <Button
                onClick={() => executeProposal(id, callback)}
                shadow_box
                fit
              >
                execute
              </Button>
            </div>
          </div>
        )}

        {showCancelButton && (
          <div>
            <p>Cancel the proposal:</p>
            <div className={styles.proposal_buttons}>
              <Button
                onClick={() => cancelProposal(id, true, callback)}
                shadow_box
                fit
              >
                cancel
              </Button>
            </div>
          </div>
        )}
      </div>
    )
  }
}
