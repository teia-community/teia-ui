import { encodePubKey } from '@taquito/utils'
import { Parser, emitMicheline } from '@taquito/michel-codec'
import { DAO_GOVERNANCE_CONTRACT, DAO_TOKEN_DECIMALS, TOKENS } from '@constants'
import { useUserStore } from '@context/userStore'
import { useDaoStore } from '@context/daoStore'
import { Page } from '@atoms/layout'
import { Button } from '@atoms/button'
import { hexToString } from '@utils/string'
import { getWordDate } from '@utils/time'
import styles from '@style'
import { TeiaUserLink, TezosAddressLink, TokenLink, IpfsLink } from './links'
import {
  useTokenBalance,
  useStorage,
  useGovernanceParameters,
  useProposals,
  useRepresentatives,
  useUserVotes,
  useCommunityVotes,
  useUsersAliases,
} from './hooks'

export function DaoProposals() {
  // Get all the required DAO information
  const daoStorage = useStorage(DAO_GOVERNANCE_CONTRACT)
  const governanceParameters = useGovernanceParameters(daoStorage)
  const proposals = useProposals(daoStorage)
  const representatives = useRepresentatives(daoStorage)

  // Get all the required user information
  const userAddress = useUserStore((st) => st.address)
  const userCommunity = representatives?.[userAddress]
  const userVotes = useUserVotes(userAddress, daoStorage)
  const userCommunityVotes = useCommunityVotes(userCommunity, daoStorage)

  // Get all the relevant users aliases
  const usersAliases = useUsersAliases(userAddress, representatives, proposals)

  // Separate the proposals depending of their current status
  const toVoteProposals = []
  const votedProposals = []
  const pendingEvaluationProposals = []
  const waitingProposals = []
  const toExecuteProposals = []
  const executedProposals = []
  const rejectedProposals = []
  const cancelledProposals = []

  if (governanceParameters && proposals && usersAliases) {
    // Loop over the complete list of proposals
    const now = new Date()

    for (const proposalId in proposals) {
      // Store the proposal id and the issuer alias inside the proposal details
      const proposal = proposals[proposalId]
      proposal.id = proposalId
      proposal.issuerAlias = usersAliases[proposal.issuer]

      // Calculate the proposal vote and wait expiration times
      const proposalGovernanceParameters =
        governanceParameters[proposal.gp_index]
      const votePeriod = parseInt(proposalGovernanceParameters.vote_period)
      const waitPeriod = parseInt(proposalGovernanceParameters.wait_period)
      const voteExpirationTime = new Date(proposal.timestamp)
      voteExpirationTime.setDate(voteExpirationTime.getDate() + votePeriod)
      const waitExpirationTime = new Date(proposal.timestamp)
      waitExpirationTime.setDate(
        waitExpirationTime.getDate() + votePeriod + waitPeriod
      )
      proposal.voteExpirationTime = voteExpirationTime
      proposal.waitExpirationTime = waitExpirationTime
      proposal.voteFinished = now > voteExpirationTime
      proposal.waitFinished = now > waitExpirationTime

      // Classify the proposal according to their status
      if (proposal.status.open) {
        if (proposal.voteFinished) {
          pendingEvaluationProposals.push(proposal)
        } else if (userVotes?.[proposalId]) {
          if (userCommunity && !userCommunityVotes?.[proposalId]) {
            toVoteProposals.push(proposal)
          } else {
            votedProposals.push(proposal)
          }
        } else {
          toVoteProposals.push(proposal)
        }
      } else if (proposal.status.approved) {
        if (proposal.waitFinished) {
          toExecuteProposals.push(proposal)
        } else {
          waitingProposals.push(proposal)
        }
      } else if (proposal.status.executed) {
        executedProposals.push(proposal)
      } else if (proposal.status.rejected) {
        rejectedProposals.push(proposal)
      } else if (proposal.status.cancelled) {
        cancelledProposals.push(proposal)
      }
    }
  }

  return (
    <Page title="DAO proposals" large>
      <div className={styles.container}>
        <div className={styles.headline}>
          <h1>DAO proposals</h1>
        </div>

        <ProposalGroup
          header="Proposals to vote"
          proposals={toVoteProposals}
          canVote
          canCancel
          allwaysShow
        >
          {toVoteProposals.length > 0 ? (
            <p>
              These proposals are still in the voting phase and you didn't vote
              for them yet.
            </p>
          ) : (
            <p>There are no new proposals to vote at the moment.</p>
          )}
        </ProposalGroup>

        <ProposalGroup
          header="Already voted proposals"
          proposals={votedProposals}
          canCancel
        >
          <p>
            These proposals are still in the voting phase, but you already voted
            them.
          </p>
        </ProposalGroup>

        <ProposalGroup
          header="Proposals pending votes results evaluation"
          proposals={pendingEvaluationProposals}
          canEvaluate
          canCancel
        >
          <p>
            The voting period for these proposals has finished. You can evaluate
            their result to see if they are approved or rejected.
          </p>
        </ProposalGroup>

        <ProposalGroup
          header="Approved proposals"
          proposals={waitingProposals}
          canCancel
        >
          <p>
            These are approved proposals that are still in the waiting phase.
            Once the waiting phase finishes, you will be able to execute them.
          </p>
        </ProposalGroup>

        <ProposalGroup
          header="Proposals to execute"
          proposals={toExecuteProposals}
          canExecute
          canCancel
        >
          <p>These are approved proposals that can be exectuded.</p>
        </ProposalGroup>

        <ProposalGroup
          header="Executed proposals"
          proposals={executedProposals}
        >
          <p>These proposals have been executed already.</p>
        </ProposalGroup>

        <ProposalGroup
          header="Rejected proposals"
          proposals={rejectedProposals}
        >
          <p>
            These proposals didn't reach the required quorum and/or
            supermajority. As a result, they were rejected by the DAO.
          </p>
        </ProposalGroup>

        <ProposalGroup
          header="Cancelled proposals"
          proposals={cancelledProposals}
        >
          <p>
            These proposals were cancelled by the proposal issuer or the DAO
            guardians.
          </p>
        </ProposalGroup>
      </div>
    </Page>
  )
}

function ProposalGroup(props) {
  if (props.proposals.length === 0 && !props.alwaysShow) {
    return
  }

  return (
    <section className={styles.section}>
      <h1 className={styles.section_title}>{props.header}</h1>

      {props.children}

      <ul className={styles.proposal_list}>
        {props.proposals.map((proposal) => (
          <li key={proposal.id}>
            <Proposal
              proposal={proposal}
              canVote={props.canVote}
              canCancel={props.canCancel}
              canEvaluate={props.canEvaluate}
              canExecute={props.canExecute}
            />
          </li>
        ))}
      </ul>
    </section>
  )
}

function Proposal(props) {
  return (
    <div className={styles.proposal}>
      <div className={styles.proposal_information}>
        <ProposalDescription proposal={props.proposal} />
        <ProposalVotesSummary proposal={props.proposal} />
      </div>
      <ProposalActions
        proposal={props.proposal}
        canVote={props.canVote}
        canCancel={props.canCancel}
        canEvaluate={props.canEvaluate}
        canExecute={props.canExecute}
      />
    </div>
  )
}

function ProposalDescription(props) {
  // Get the proposal title and description
  const proposal = props.proposal
  const title = hexToString(proposal.title)
  const description = hexToString(proposal.description)

  // Try to extract an ipfs cid from the proposal description
  const cid = description.split('/')[2]

  return (
    <div>
      <p>
        <span className={styles.proposal_id}>#{proposal.id}</span>
        <b>{title}</b>
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

      {!proposal.voteFinished && (
        <p>Voting period ends on {getWordDate(proposal.voteExpirationTime)}.</p>
      )}

      {proposal.voteFinished && !proposal.waitFinished && (
        <p>
          Waiting period ends on {getWordDate(proposal.waitExpirationTime)}.
        </p>
      )}

      <p>
        Description: {cid ? <IpfsLink cid={cid}>ipfs</IpfsLink> : description}
      </p>

      <ProposalContent content={proposal.kind} />
    </div>
  )
}

function ProposalContent(props) {
  const content = props.content

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
          <details>
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
          <details>
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
        <details>
          <summary>See Micheline code</summary>
          <pre className={styles.micheline_code}>{encodedMichelineCode}</pre>
        </details>
      </>
    )
  }
}

function ProposalVotesSummary(props) {
  // Get all the required DAO information
  const daoStorage = useStorage(DAO_GOVERNANCE_CONTRACT)
  const governanceParameters = useGovernanceParameters(daoStorage)
  const representatives = useRepresentatives(daoStorage)

  // Get all the required user information
  const userAddress = useUserStore((st) => st.address)
  const userCommunity = representatives?.[userAddress]
  const userTokenBalance = useTokenBalance(userAddress)
  const userVotes = useUserVotes(userAddress, daoStorage)
  const userCommunityVotes = useCommunityVotes(userCommunity, daoStorage)

  // Get the proposal quorum and governance parameters
  const proposal = props.proposal
  const quorum = proposal.quorum
  const proposalGovernanceParameters = governanceParameters[proposal.gp_index]

  // Calculate the sum of the token and representatives votes
  const tokenVotes = proposal.token_votes
  const representativesVotes = proposal.representatives_votes
  let totalVotes = parseInt(tokenVotes.total)
  let positiveVotes = parseInt(tokenVotes.positive)
  let negativeVotes = parseInt(tokenVotes.negative)
  let abstainVotes = parseInt(tokenVotes.abstain)

  if (representativesVotes.total > 0) {
    const share = Math.min(
      proposalGovernanceParameters.representatives_share,
      representativesVotes.total *
        proposalGovernanceParameters.representative_max_share
    )
    const representativesTotalVotes = Math.floor((quorum * share) / 100)
    totalVotes += representativesTotalVotes
    positiveVotes += Math.floor(
      (representativesTotalVotes * representativesVotes.positive) /
        representativesVotes.total
    )
    negativeVotes += Math.floor(
      (representativesTotalVotes * representativesVotes.negative) /
        representativesVotes.total
    )
    abstainVotes += Math.floor(
      (representativesTotalVotes * representativesVotes.abstain) /
        representativesVotes.total
    )
  }

  // Check if the proposal passes the quorum and supermajority
  const passesQuorum = totalVotes > quorum
  const supermajority = proposalGovernanceParameters.supermajority / 100
  const passesSupermajority =
    positiveVotes > Math.floor((positiveVotes + negativeVotes) * supermajority)

  // Calculate the number of votes needed to reach the quorum
  const requiredVotesForQuorum = passesQuorum ? 0 : quorum - totalVotes

  // Calculate the vote scaling depending on the vote method
  const voteScaling = proposalGovernanceParameters.vote_method.linear
    ? DAO_TOKEN_DECIMALS
    : Math.pow(DAO_TOKEN_DECIMALS, 0.5)

  // Calculate the number of yes votes needed to reach supermajority
  const requiredYesVotesForSupermajority = passesSupermajority
    ? 0
    : positiveVotes === 0
    ? voteScaling
    : (negativeVotes * supermajority) / (1 - supermajority) - positiveVotes

  // Check if the user is a DAO member
  const isDaoMember = userTokenBalance > 0

  // Get the user vote and the vote class name
  const userVote = userVotes?.[proposal.id]?.vote
  const voteClassName = !userVote
    ? ''
    : userVote.yes
    ? styles.yes_vote
    : userVote.no
    ? styles.no_vote
    : styles.abstain_vote

  // Get the user community vote and the community vote class name
  const userCommunityVote = userCommunityVotes?.[proposal.id]
  const communityVoteClassName = !userCommunityVote
    ? ''
    : userCommunityVote.yes
    ? styles.yes_vote
    : userCommunityVote.no
    ? styles.no_vote
    : styles.abstain_vote

  return (
    <div className={styles.proposal_votes_summary}>
      <VotesDisplay
        title="Token votes:"
        yes={tokenVotes.positive / voteScaling}
        no={tokenVotes.negative / voteScaling}
        abstain={tokenVotes.abstain / voteScaling}
      />

      <VotesDisplay
        title="Representatives votes:"
        yes={representativesVotes.positive}
        no={representativesVotes.negative}
        abstain={representativesVotes.abstain}
      />

      <VotesDisplay
        title="Combined votes:"
        yes={positiveVotes / voteScaling}
        no={negativeVotes / voteScaling}
        abstain={abstainVotes / voteScaling}
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
        <div>
          <p>Your votes:</p>
          <span className={styles.user_votes + ' ' + voteClassName} />
          {userCommunity && (
            <span
              className={styles.user_votes + ' ' + communityVoteClassName}
            />
          )}
        </div>
      )}
    </div>
  )
}

function VotesDisplay(props) {
  const totalVotes =
    parseInt(props.yes) + parseInt(props.no) + parseInt(props.abstain)
  const yesPercent = (100 * props.yes) / totalVotes
  const noPercent = (100 * props.no) / totalVotes
  const abstainPercent = (100 * props.abstain) / totalVotes

  return (
    <div className={styles.votes_display}>
      <p className={styles.votes_display_title}>{props.title}</p>
      <div className={styles.votes_display_result}>
        {totalVotes === 0 && (
          <div
            className={styles.vote_display_nothing}
            style={{ width: '100%' }}
          >
            0
          </div>
        )}
        {yesPercent > 0 && (
          <div
            className={styles.vote_display_yes}
            style={{ width: yesPercent + '%' }}
          >
            {Math.round(props.yes)}
          </div>
        )}
        {noPercent > 0 && (
          <div
            className={styles.vote_display_no}
            style={{ width: noPercent + '%' }}
          >
            {Math.round(props.no)}
          </div>
        )}
        {abstainPercent > 0 && (
          <div
            className={styles.vote_display_abstain}
            style={{ width: abstainPercent + '%' }}
          >
            {Math.round(props.abstain)}
          </div>
        )}
      </div>
    </div>
  )
}

function ProposalActions(props) {
  // Get all the required DAO information
  const daoStorage = useStorage(DAO_GOVERNANCE_CONTRACT)
  const governanceParameters = useGovernanceParameters(daoStorage)
  const representatives = useRepresentatives(daoStorage)

  // Get all the required user information
  const userAddress = useUserStore((st) => st.address)
  const userTokenBalance = useTokenBalance(userAddress)
  const userCommunity = representatives?.[userAddress]
  const userVotes = useUserVotes(userAddress, daoStorage)
  const communityVotes = useCommunityVotes(userCommunity, daoStorage)

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
  const proposal = props.proposal
  const userCanVote =
    userTokenBalance >=
    governanceParameters[proposal.gp_index].min_amount / DAO_TOKEN_DECIMALS

  return (
    <div className={styles.proposal_actions}>
      {props.canVote && userCanVote && !userVotes?.[proposal.id] && (
        <div>
          <p>Vote with your tokens:</p>
          <div className={styles.proposal_actions_buttons}>
            <Button shadow_box onClick={() => voteProposal(proposal.id, 'yes')}>
              yes
            </Button>
            <Button shadow_box onClick={() => voteProposal(proposal.id, 'no')}>
              no
            </Button>
            <Button
              shadow_box
              onClick={() => voteProposal(proposal.id, 'abstain')}
            >
              abstain
            </Button>
          </div>
        </div>
      )}

      {props.canVote && userCommunity && !communityVotes?.[proposal.id] && (
        <div>
          <p>Vote as representative:</p>
          <div className={styles.proposal_actions_buttons}>
            <Button
              shadow_box
              onClick={() => voteProposalAsRepresentative(proposal.id, 'yes')}
            >
              yes
            </Button>
            <Button
              shadow_box
              onClick={() => voteProposalAsRepresentative(proposal.id, 'no')}
            >
              no
            </Button>
            <Button
              shadow_box
              onClick={() =>
                voteProposalAsRepresentative(proposal.id, 'abstain')
              }
            >
              abstain
            </Button>
          </div>
        </div>
      )}

      <div className={styles.proposal_actions_buttons}>
        {props.canCancel && proposal.issuer === userAddress && (
          <Button shadow_box onClick={() => cancelProposal(proposal.id, true)}>
            cancel
          </Button>
        )}
        {props.canEvaluate && isDaoMember && (
          <Button shadow_box onClick={() => evaluateVotingResult(proposal.id)}>
            evaluate
          </Button>
        )}
        {props.canExecute && isDaoMember && (
          <Button shadow_box onClick={() => executeProposal(proposal.id)}>
            execute
          </Button>
        )}
      </div>
    </div>
  )
}
