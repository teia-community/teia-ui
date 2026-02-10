import { useState } from 'react'
import { Link } from 'react-router-dom'
import { bytesToString } from '@tezos-x/octez.js-utils'
import {
  PATH,
  DAO_GOVERNANCE_CONTRACT,
  DAO_TOKEN_DECIMALS,
  TOKENS,
} from '@constants'
import { useUserStore } from '@context/userStore'
import { useDaoStore } from '@context/daoStore'
import { Button } from '@atoms/button'
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

export default function Proposal({ proposalId }) {
  // Get all the required DAO information
  const [daoStorage] = useStorage(DAO_GOVERNANCE_CONTRACT)
  const [governanceParameters] = useDaoGovernanceParameters(daoStorage)
  const [proposals, updateProposals] = useDaoProposals(daoStorage)
  const [representatives] = useDaoRepresentatives(daoStorage)

  // Get all the required user information
  const userAddress = useUserStore((st) => st.address)
  const userCommunity = representatives?.[userAddress]
  const [userTokenBalance, updateUserTokenBalance] =
    useDaoTokenBalance(userAddress)
  const [userVotes, updateUserVotes] = useDaoUserVotes(userAddress, daoStorage)
  const [userCommunityVotes, updateUserCommunityVotes] = useDaoCommunityVotes(
    userCommunity,
    daoStorage
  )

  // Get all the relevant users aliases
  const [usersAliases] = useDaoUsersAliases(
    userAddress,
    representatives,
    proposals
  )

  // Return if we are missing important information
  if (!governanceParameters || !proposals) {
    return
  }

  // Check if the user is a DAO member and has enough tokens to vote proposals
  const proposal = proposals[proposalId]
  const gp = governanceParameters[proposal.gp_index]
  const isDaoMember = userTokenBalance > 0
  const userCanVote = userTokenBalance >= gp.min_amount / DAO_TOKEN_DECIMALS

  // Check if the proposal vote and wait periods finished
  const votePeriod = parseInt(gp.vote_period)
  const waitPeriod = parseInt(gp.wait_period)
  const voteExpirationTime = new Date(proposal.timestamp)
  voteExpirationTime.setDate(voteExpirationTime.getDate() + votePeriod)
  const waitExpirationTime = new Date(proposal.timestamp)
  waitExpirationTime.setDate(
    waitExpirationTime.getDate() + votePeriod + waitPeriod
  )
  const now = new Date()
  const voteFinished = now > voteExpirationTime
  const waitFinished = now > waitExpirationTime

  // Save the information inside the proposal
  proposal.id = proposalId
  proposal.voteExpirationTime = voteExpirationTime
  proposal.waitExpirationTime = waitExpirationTime
  proposal.voteFinished = voteFinished
  proposal.waitFinished = waitFinished

  return (
    <div className={styles.proposal}>
      <h3 className={styles.proposal_title}>
        <Link
          aria-label={`Proposal ${proposalId}`}
          to={`${PATH.PROPOSAL}/${proposalId}`}
          className={styles.proposal_id}
        >
          #{proposalId}
        </Link>
        {bytesToString(proposal.title)}
      </h3>

      <div className={styles.proposal_information}>
        <div>
          <ProposalDescription proposal={proposal} aliases={usersAliases} />

          <ProposalVotesSummary
            tokenVotes={proposal.token_votes}
            representativesVotes={proposal.representatives_votes}
            quorum={proposal.quorum}
            gp={gp}
            showUserVotes={
              userTokenBalance > 0 ||
              userCommunity ||
              (userVotes && Object.keys(userVotes).length > 0)
            }
            userCommunity={userCommunity}
            userVote={userVotes?.[proposalId]}
            userCommunityVote={userCommunityVotes?.[proposalId]}
          />
        </div>

        <ProposalActions
          proposalId={proposalId}
          canVote={
            proposal.status.open &&
            !voteFinished &&
            userCanVote &&
            !userVotes?.[proposalId]
          }
          canVoteAsRepresentative={
            proposal.status.open &&
            !voteFinished &&
            userCommunity &&
            !userCommunityVotes?.[proposalId]
          }
          canEvaluate={proposal.status.open && voteFinished && isDaoMember}
          canExecute={proposal.status.approved && waitFinished && isDaoMember}
          canCancel={
            (proposal.status.open || proposal.status.approved) &&
            (proposal.issuer === userAddress ||
              daoStorage.guardians === userAddress)
          }
          callback={() => {
            updateProposals()
            updateUserTokenBalance()
            updateUserVotes()
            updateUserCommunityVotes()
          }}
        />
      </div>
    </div>
  )
}

function ProposalDescription({ proposal, aliases }) {
  // Try to extract an ipfs cid from the proposal description
  const description = bytesToString(proposal.description)
  const cid = description.split('//')[1]

  return (
    <div>
      <p>
        Proposed by{' '}
        <TeiaUserLink
          address={proposal.issuer}
          alias={aliases?.[proposal.issuer]}
          shorten
        />{' '}
        on {getWordDate(proposal.timestamp)}.
      </p>

      <p>{`Status: ${Object.keys(proposal.status)[0].toUpperCase()}`}</p>

      {!proposal.status.cancelled &&
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
        Description: {cid ? <IpfsLink cid={cid}>IPFS</IpfsLink> : description}
      </p>

      <ProposalContent content={proposal.kind} aliases={aliases} />
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

function ProposalVotesSummary({
  tokenVotes,
  representativesVotes,
  quorum,
  gp,
  showUserVotes,
  userCommunity,
  userVote,
  userCommunityVote,
}) {
  // Define the component state
  const [showValues, setShowValues] = useState(false)

  // Get the relevant governance parameters
  const supermajority = gp.supermajority / 100
  const voteScaling = gp.vote_method.linear
    ? DAO_TOKEN_DECIMALS
    : Math.pow(DAO_TOKEN_DECIMALS, 0.5)

  // Calculate the weight in votes of a single representative
  const representativeShare =
    representativesVotes.total > 0
      ? Math.min(
          gp.representatives_share / representativesVotes.total,
          gp.representative_max_share
        ) / 100
      : 0
  const representativeWeight = quorum * representativeShare

  // Calculate the sum of the token and representatives votes
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
    positiveVotes > (positiveVotes + negativeVotes) * supermajority

  // Calculate the number of votes needed to reach the quorum
  const requiredVotesForQuorum = passesQuorum ? 0 : quorum - totalVotes

  // Calculate the number of yes votes needed to reach supermajority
  const requiredYesVotesForSupermajority = passesSupermajority
    ? 0
    : totalVotes === 0
    ? voteScaling
    : (negativeVotes * supermajority) / (1 - supermajority) - positiveVotes

  return (
    <div>
      <p>Token votes:</p>
      <Votes
        votes={{
          yes: tokenVotes.positive / voteScaling,
          no: tokenVotes.negative / voteScaling,
          abstain: tokenVotes.abstain / voteScaling,
        }}
        showValues={showValues}
        onClick={() => setShowValues(!showValues)}
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
        showValues={showValues}
        onClick={() => setShowValues(!showValues)}
      />

      <p>Combined votes:</p>
      <Votes
        votes={{
          yes: positiveVotes / voteScaling,
          no: negativeVotes / voteScaling,
          abstain: abstainVotes / voteScaling,
        }}
        showValues={showValues}
        onClick={() => setShowValues(!showValues)}
      />

      <p>
        Passes supermajority condition?{' '}
        {passesSupermajority
          ? 'Yes.'
          : `No, ${Math.ceil(
              requiredYesVotesForSupermajority / voteScaling
            )} yes vote${
              requiredYesVotesForSupermajority !== voteScaling ? 's' : ''
            } still missing.`}
      </p>

      <p>
        Passes minimum quorum condition?{' '}
        {passesQuorum
          ? 'Yes.'
          : `No, ${Math.ceil(requiredVotesForQuorum / voteScaling)} vote${
              requiredVotesForQuorum !== voteScaling ? 's' : ''
            } still missing.`}
      </p>

      {showUserVotes && (
        <p>
          Your votes:
          <span className={styles.user_vote}>
            <Votes
              votes={{
                yes: userVote?.vote.yes ? userVote.weight / voteScaling : 0,
                no: userVote?.vote.no ? userVote.weight / voteScaling : 0,
                abstain: userVote?.vote.abstain
                  ? userVote.weight / voteScaling
                  : 0,
              }}
              showValues={showValues}
              onClick={() => setShowValues(!showValues)}
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
                showValues={showValues}
                onClick={() => setShowValues(!showValues)}
              />
            </span>
          )}
        </p>
      )}
    </div>
  )
}

function ProposalActions({
  proposalId,
  canVote,
  canVoteAsRepresentative,
  canEvaluate,
  canExecute,
  canCancel,
  callback,
}) {
  // Get the contract call methods from the DAO store
  const voteProposal = useDaoStore((st) => st.voteProposal)
  const voteProposalAsRepresentative = useDaoStore(
    (st) => st.voteProposalAsRepresentative
  )
  const cancelProposal = useDaoStore((st) => st.cancelProposal)
  const evaluateVotingResult = useDaoStore((st) => st.evaluateVotingResult)
  const executeProposal = useDaoStore((st) => st.executeProposal)

  if (
    canVote ||
    canVoteAsRepresentative ||
    canEvaluate ||
    canExecute ||
    canCancel
  ) {
    return (
      <div>
        {canVote && (
          <div>
            <p>Vote with your tokens:</p>
            <div className={styles.proposal_buttons}>
              <Button
                onClick={() => voteProposal(proposalId, 'yes', null, callback)}
                shadow_box
                fit
              >
                yes
              </Button>
              <Button
                onClick={() => voteProposal(proposalId, 'no', null, callback)}
                shadow_box
                fit
              >
                no
              </Button>
              <Button
                onClick={() =>
                  voteProposal(proposalId, 'abstain', null, callback)
                }
                shadow_box
                fit
              >
                abstain
              </Button>
            </div>
          </div>
        )}

        {canVoteAsRepresentative && (
          <div>
            <p>Vote as representative:</p>
            <div className={styles.proposal_buttons}>
              <Button
                onClick={() =>
                  voteProposalAsRepresentative(proposalId, 'yes', callback)
                }
                shadow_box
                fit
              >
                yes
              </Button>
              <Button
                onClick={() =>
                  voteProposalAsRepresentative(proposalId, 'no', callback)
                }
                shadow_box
                fit
              >
                no
              </Button>
              <Button
                onClick={() =>
                  voteProposalAsRepresentative(proposalId, 'abstain', callback)
                }
                shadow_box
                fit
              >
                abstain
              </Button>
            </div>
          </div>
        )}

        {canEvaluate && (
          <div>
            <p>Evaluate the proposal:</p>
            <div className={styles.proposal_buttons}>
              <Button
                onClick={() => evaluateVotingResult(proposalId, callback)}
                shadow_box
                fit
              >
                evaluate
              </Button>
            </div>
          </div>
        )}

        {canExecute && (
          <div>
            <p>Execute the proposal:</p>
            <div className={styles.proposal_buttons}>
              <Button
                onClick={() => executeProposal(proposalId, callback)}
                shadow_box
                fit
              >
                execute
              </Button>
            </div>
          </div>
        )}

        {canCancel && (
          <div>
            <p>Cancel the proposal:</p>
            <div className={styles.proposal_buttons}>
              <Button
                onClick={() => cancelProposal(proposalId, true, callback)}
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
