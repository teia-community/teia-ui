import { useState } from 'react'
import { encodePubKey } from '@taquito/utils'
import { Parser, emitMicheline } from '@taquito/michel-codec'
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
  useStorage,
  useDaoGovernanceParameters,
  useDaoProposals,
  useDaoRepresentatives,
  useDaoTokenBalance,
  useDaoUserVotes,
  useDaoCommunityVotes,
  useDaoUsersAliases,
} from '@data/swr'
import Votes from '@components/votes'
import { hexToString } from '@utils/string'
import { getWordDate } from '@utils/time'
import styles from '@style'

const PROPOSAL_STATUS_OPTIONS = {
  toVote: 'Proposals to vote',
  voted: 'Already voted proposals',
  toEvaluate: 'Proposals pending votes results evaluation',
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

  // Get all the relevant users aliases
  const [usersAliases] = useDaoUsersAliases(
    userAddress,
    representatives,
    proposals
  )

  // Separate the proposals depending of their current status
  const proposalsByStatus = Object.fromEntries(
    Object.keys(PROPOSAL_STATUS_OPTIONS).map((status) => [status, []])
  )

  if (governanceParameters && proposals && usersAliases) {
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
      proposal.issuerAlias = usersAliases[proposal.issuer]
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
  if (proposals.length === 0) {
    return
  }

  return (
    <ul className={styles.proposal_list}>
      {proposals.map((proposal, index) => (
        <li key={proposal.id}>
          <Proposal proposal={proposal} {...actions} />
          {index !== proposals.length - 1 && <Line />}
        </li>
      ))}
    </ul>
  )
}

function Proposal({ proposal, ...actions }) {
  return (
    <div className={styles.proposal}>
      <div className={styles.proposal_information}>
        <ProposalDescription proposal={proposal} />
        <ProposalVotesSummary proposal={proposal} />
      </div>
      <ProposalActions proposal={proposal} {...actions} />
    </div>
  )
}

function ProposalDescription({ proposal }) {
  // Get the proposal title and description
  const title = hexToString(proposal.title)
  const description = hexToString(proposal.description)

  // Try to extract an ipfs cid from the proposal description
  const cid = description.split('//')[1]

  return (
    <div>
      <p>
        <span className={styles.proposal_id}>#{proposal.id}</span>
        <span className={styles.proposal_title}>{title}</span>
      </p>

      <p>
        Proposed by{' '}
        <TeiaUserLink
          address={proposal.issuer}
          alias={proposal.issuerAlias}
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
        {cid ? <IpfsLink cid={cid}>open file in ipfs</IpfsLink> : description}
      </p>

      <ProposalContent content={proposal.kind} />
    </div>
  )
}

function ProposalContent({ content }) {
  if (content.text) {
    return <p>Effect: Approves a text proposal.</p>
  } else if (content.transfer_mutez) {
    // Extract the transfers information
    const transfers = content.transfer_mutez
    const totalAmount = transfers.reduce(
      (previous, current) => previous + parseInt(current.amount),
      0
    )

    if (transfers.length === 1) {
      return (
        <p>
          Effect: Transfers {totalAmount / 1000000} tez to{' '}
          <TezosAddressLink address={transfers[0].destination} shorten />.
        </p>
      )
    } else {
      return (
        <>
          <p>Effect: Transfers {totalAmount / 1000000} tez.</p>
          <details className={styles.proposal_details}>
            <summary>See transfer details</summary>
            <table>
              <tbody>
                {transfers.map((transfer, index) => (
                  <tr key={index}>
                    <td>{transfer.amount / 1000000} tez to</td>
                    <td>
                      <TezosAddressLink
                        address={transfer.destination}
                        shorten
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        </>
      )
    }
  } else if (content.transfer_token) {
    // Extract the transfers information
    const fa2 = content.transfer_token.fa2
    const tokenId = content.transfer_token.token_id
    const transfers = content.transfer_token.distribution
    const nEditions = transfers.reduce(
      (previous, current) => previous + parseInt(current.amount),
      0
    )
    const token = TOKENS.find((token) => token.fa2 === fa2)

    if (transfers.length === 1) {
      return (
        <p>
          Effect: Transfers {token ? nEditions / token.decimals : nEditions}{' '}
          {token?.multiasset
            ? `edition${nEditions > 1 ? 's' : ''} of token`
            : ''}{' '}
          <TokenLink fa2={fa2} id={tokenId}>
            {token ? (token.multiasset ? '#' + tokenId : token.name) : 'tokens'}
          </TokenLink>{' '}
          to <TezosAddressLink address={transfers[0].destination} shorten />.
        </p>
      )
    } else {
      return (
        <>
          <p>
            Effect: Transfers {token ? nEditions / token.decimals : nEditions}{' '}
            {token?.multiasset ? 'editions of token' : ''}{' '}
            <TokenLink fa2={fa2} id={tokenId}>
              {token
                ? token.multiasset
                  ? '#' + tokenId
                  : token.name
                : 'tokens'}
            </TokenLink>
            .
          </p>
          <details className={styles.proposal_details}>
            <summary>See transfer details</summary>
            <table>
              <tbody>
                {transfers.map((transfer, index) => (
                  <tr key={index}>
                    <td>
                      {token
                        ? transfer.amount / token.decimals
                        : transfer.amount}{' '}
                      {token?.multiasset
                        ? `edition${transfer.amount > 1 ? 's' : ''}`
                        : ''}{' '}
                      to
                    </td>
                    <td>
                      <TezosAddressLink
                        address={transfer.destination}
                        shorten
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        </>
      )
    }
  } else {
    // Transform the lambda function Michelson JSON code to Micheline code
    const parser = new Parser()
    const michelsonCode = parser.parseJSON(JSON.parse(content.lambda_function))
    const michelineCode = emitMicheline(michelsonCode, {
      indent: '    ',
      newline: '\n',
    })

    // Encode any addresses that the Micheline code might contain
    const encodedMichelineCode = michelineCode.replace(
      /0x0[0123]{1}[\w\d]{42}/g,
      (match) => `"${encodePubKey(match.slice(2))}"`
    )

    return (
      <>
        <p>Effect: Executes a lambda function.</p>
        <details className={styles.proposal_details}>
          <summary>See Micheline code</summary>
          <pre className={styles.micheline_code}>{encodedMichelineCode}</pre>
        </details>
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

  // Calculate the sum of the token and representatives votes
  const tokenVotes = proposal.token_votes
  const repsVotes = proposal.representatives_votes
  const representativeShare =
    repsVotes.total > 0
      ? Math.min(
          gp.representatives_share / repsVotes.total,
          gp.representative_max_share
        ) / 100
      : 0
  const representativeWeight = quorum * representativeShare
  const totalVotes =
    parseInt(tokenVotes.total) + repsVotes.total * representativeWeight
  const positiveVotes =
    parseInt(tokenVotes.positive) + repsVotes.positive * representativeWeight
  const negativeVotes =
    parseInt(tokenVotes.negative) + repsVotes.negative * representativeWeight
  const abstainVotes =
    parseInt(tokenVotes.abstain) + repsVotes.abstain * representativeWeight

  // Check if the proposal passes the quorum and supermajority
  const passesQuorum = totalVotes > quorum
  const passesSupermajority =
    positiveVotes > Math.floor((positiveVotes + negativeVotes) * supermajority)

  // Calculate the number of votes needed to reach the quorum
  const requiredVotesForQuorum = passesQuorum ? 0 : quorum - totalVotes

  // Calculate the vote scaling depending on the vote method
  const voteScaling = gp.vote_method.linear
    ? DAO_TOKEN_DECIMALS
    : Math.pow(DAO_TOKEN_DECIMALS, 0.5)

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
    <div className={styles.proposal_votes_summary}>
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
          yes: (repsVotes.positive * representativeWeight) / voteScaling,
          no: (repsVotes.negative * representativeWeight) / voteScaling,
          abstain: (repsVotes.abstain * representativeWeight) / voteScaling,
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
          ? 'yes'
          : `no, ${Math.ceil(
              requiredYesVotesForSupermajority / voteScaling
            )} yes votes still missing.`}
      </p>

      <p>
        Passes minimum quorum condition?{' '}
        {passesQuorum
          ? 'yes'
          : `no, ${Math.ceil(
              requiredVotesForQuorum / voteScaling
            )} votes still missing.`}
      </p>

      {(isDaoMember || (userVotes && Object.keys(userVotes).length > 0)) && (
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
  const id = proposal.id
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

  return (
    <div>
      {canVote && userCanVote && !userVotes?.[id] && (
        <div>
          <p>Vote with your tokens:</p>
          <div className={styles.proposal_buttons}>
            <Button
              shadow_box
              onClick={() => voteProposal(id, 'yes', null, callback)}
            >
              yes
            </Button>
            <Button
              shadow_box
              onClick={() => voteProposal(id, 'no', null, callback)}
            >
              no
            </Button>
            <Button
              shadow_box
              onClick={() => voteProposal(id, 'abstain', null, callback)}
            >
              abstain
            </Button>
          </div>
        </div>
      )}

      {canVote && userCommunity && !communityVotes?.[id] && (
        <div>
          <p>Vote as representative:</p>
          <div className={styles.proposal_buttons}>
            <Button
              shadow_box
              onClick={() => voteProposalAsRepresentative(id, 'yes', callback)}
            >
              yes
            </Button>
            <Button
              shadow_box
              onClick={() => voteProposalAsRepresentative(id, 'no', callback)}
            >
              no
            </Button>
            <Button
              shadow_box
              onClick={() =>
                voteProposalAsRepresentative(id, 'abstain', callback)
              }
            >
              abstain
            </Button>
          </div>
        </div>
      )}

      <div className={styles.proposal_buttons}>
        {canCancel &&
          (proposal.issuer === userAddress ||
            daoStorage?.guardians === userAddress) && (
            <Button
              shadow_box
              onClick={() => cancelProposal(id, true, callback)}
            >
              cancel
            </Button>
          )}
        {canEvaluate && isDaoMember && (
          <Button shadow_box onClick={() => evaluateVotingResult(id, callback)}>
            evaluate
          </Button>
        )}
        {canExecute && isDaoMember && (
          <Button shadow_box onClick={() => executeProposal(id, callback)}>
            execute
          </Button>
        )}
      </div>
    </div>
  )
}
