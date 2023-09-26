import { encodePubKey } from '@taquito/utils'
import { Parser, emitMicheline } from '@taquito/michel-codec'
import { DAO_GOVERNANCE_CONTRACT, DAO_TOKEN_DECIMALS, TOKENS } from '@constants'
import { Page } from '@atoms/layout'
import { useUserStore } from '@context/userStore'
import { hexToString } from '@utils/string'
import { Button } from '@atoms/button'
import { TezosAddressLink, TokenLink, IpfsLink } from './links'
import styles from '@style'
import {
  useTokenBalance,
  useStorage,
  useGovernanceParameters,
  useProposals,
  useRepresentatives,
  useUserVotes,
  useCommunityVotes,
} from './hooks'

export function DaoProposals() {
  // Get all the required DAO information
  const daoStorage = useStorage(DAO_GOVERNANCE_CONTRACT)
  const governanceParameters = useGovernanceParameters(daoStorage)
  const proposals = useProposals(daoStorage)
  const representatives = useRepresentatives(daoStorage)

  // Get all the required user information
  const userAddress = useUserStore((st) => st.address)
  const userCommunity =
    userAddress && representatives ? representatives[userAddress] : undefined
  const userVotes = useUserVotes(userAddress, daoStorage)
  const communityVotes = useCommunityVotes(userCommunity, daoStorage)

  // Separate the proposals depending of their current status
  const toVoteProposals = []
  const votedProposals = []
  const pendingEvaluationProposals = []
  const waitingProposals = []
  const toExecuteProposals = []
  const executedProposals = []
  const rejectedProposals = []
  const cancelledProposals = []

  if (governanceParameters && proposals) {
    // Loop over the complete list of proposals
    const now = new Date()

    for (const proposal of proposals) {
      // Get the vote and wait period from the proposal governance parameters
      const proposalGovernanceParameters =
        governanceParameters[proposal.value.gp_index]
      const votePeriod = parseInt(proposalGovernanceParameters.vote_period)
      const waitPeriod = parseInt(proposalGovernanceParameters.wait_period)

      if (proposal.value.status.open) {
        // Check if the proposal voting period has expired
        const voteExpirationTime = new Date(proposal.value.timestamp)
        voteExpirationTime.setDate(voteExpirationTime.getDate() + votePeriod)

        if (now > voteExpirationTime) {
          pendingEvaluationProposals.push(proposal)
        } else if (userVotes && userVotes[proposal.key]) {
          if (communityVotes && !communityVotes[proposal.key]) {
            toVoteProposals.push(proposal)
          } else {
            votedProposals.push(proposal)
          }
        } else {
          toVoteProposals.push(proposal)
        }
      } else if (proposal.value.status.approved) {
        // Check if the proposal waiting period has passed or not
        const waitExpirationTime = new Date(proposal.value.timestamp)
        waitExpirationTime.setDate(
          waitExpirationTime.getDate() + votePeriod + waitPeriod
        )

        if (now > waitExpirationTime) {
          toExecuteProposals.push(proposal)
        } else {
          waitingProposals.push(proposal)
        }
      } else if (proposal.value.status.executed) {
        executedProposals.push(proposal)
      } else if (proposal.value.status.rejected) {
        rejectedProposals.push(proposal)
      } else if (proposal.value.status.cancelled) {
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

        <section className={styles.section}>
          <h1 className={styles.section_title}>Proposals to vote</h1>
          {toVoteProposals.length > 0 ? (
            <p>
              These proposals are still in the voting phase and you didn't vote
              for them yet.
            </p>
          ) : (
            <p>There are no new proposals to vote at the moment.</p>
          )}
          <ProposalList proposals={toVoteProposals} canVote canCancel />
        </section>

        {votedProposals.length > 0 && (
          <section className={styles.section}>
            <h1 className={styles.section_title}>Already voted proposals</h1>
            <p>
              These proposals are still in the voting phase, but you already
              voted them.
            </p>
            <ProposalList proposals={votedProposals} canCancel />
          </section>
        )}

        {pendingEvaluationProposals.length > 0 && (
          <section className={styles.section}>
            <h1 className={styles.section_title}>
              Proposals pending votes results evaluation
            </h1>
            <p>
              The voting period for these proposals has finished. You can
              evaluate their result to see if they are approved or rejected.
            </p>
            <ProposalList
              proposals={pendingEvaluationProposals}
              canEvaluate
              canCancel
            />
          </section>
        )}

        {waitingProposals.length > 0 && (
          <section className={styles.section}>
            <h1 className={styles.section_title}>Approved proposals</h1>
            <p>
              These are approved proposals that are still in the waiting phase.
              Once the waiting phase finishes, you will be able to execute them.
            </p>
            <ProposalList proposals={waitingProposals} canCancel />
          </section>
        )}

        {toExecuteProposals.length > 0 && (
          <section className={styles.section}>
            <h1 className={styles.section_title}>Proposals to execute</h1>
            <p>These are approved proposals that can be exectuded.</p>
            <ProposalList proposals={toExecuteProposals} canExecute canCancel />
          </section>
        )}

        {executedProposals.length > 0 && (
          <section className={styles.section}>
            <h1 className={styles.section_title}>Executed proposals</h1>
            <p>These proposals have been executed already.</p>
            <ProposalList proposals={executedProposals} />
          </section>
        )}

        {rejectedProposals.length > 0 && (
          <section className={styles.section}>
            <h1 className={styles.section_title}>Rejected proposals</h1>
            <p>
              These proposals didn't reach the required quorum and/or
              supermajority. As a result, they were rejected by the DAO.
            </p>
            <ProposalList proposals={rejectedProposals} />
          </section>
        )}

        {cancelledProposals.length > 0 && (
          <section className={styles.section}>
            <h1 className={styles.section_title}>Cancelled proposals</h1>
            <p>
              These proposals were cancelled by the proposal issuer or the DAO
              guardians.
            </p>
            <ProposalList proposals={cancelledProposals} />
          </section>
        )}
      </div>
    </Page>
  )
}

function ProposalList(props) {
  return (
    <ul className={styles.proposal_list}>
      {props.proposals.map((proposal) => (
        <li key={proposal.key}>
          <Proposal
            proposalId={proposal.key}
            proposal={proposal.value}
            canVote={props.canVote}
            canCancel={props.canCancel}
            canEvaluate={props.canEvaluate}
            canExecute={props.canExecute}
          />
        </li>
      ))}
    </ul>
  )
}

function Proposal(props) {
  return (
    <div className={styles.proposal}>
      <ProposalInitialBlock
        id={props.proposalId}
        timestamp={props.proposal.timestamp}
      />
      <ProposalDescription id={props.proposalId} proposal={props.proposal} />
      <ProposalActions
        id={props.proposalId}
        proposal={props.proposal}
        canVote={props.canVote}
        canCancel={props.canCancel}
        canEvaluate={props.canEvaluate}
        canExecute={props.canExecute}
      />
    </div>
  )
}

function ProposalInitialBlock(props) {
  // Get all the required DAO information
  const daoStorage = useStorage(DAO_GOVERNANCE_CONTRACT)
  const representatives = useRepresentatives(daoStorage)

  // Get all the required user information
  const userAddress = useUserStore((st) => st.address)
  const userCommunity =
    userAddress && representatives ? representatives[userAddress] : undefined
  const userTokenBalance = useTokenBalance(userAddress)
  const userVotes = useUserVotes(userAddress, daoStorage)
  const communityVotes = useCommunityVotes(userCommunity, daoStorage)

  // Check if the user is a DAO member
  const isMember = userTokenBalance > 0

  // Check if the user is a community representative
  const isRepresentative = communityVotes !== undefined

  // Get the user vote and the vote class name
  const userVote = userVotes && userVotes[props.id]?.vote
  let voteClassName = ''

  if (userVote) {
    voteClassName = userVote.yes
      ? styles.yes_vote
      : userVote.no
      ? styles.no_vote
      : styles.abstain_vote
  }

  // Get the community vote and the community vote class name
  const communityVote = communityVotes && communityVotes[props.id]
  let communityVoteClassName = ''

  if (communityVote) {
    communityVoteClassName = communityVote.yes
      ? styles.yes_vote
      : communityVote.no
      ? styles.no_vote
      : styles.abstain_vote
  }

  return (
    <div>
      <p className={styles.proposal_timestamp}>{props.timestamp}</p>

      {isMember && <span className={styles.user_votes + ' ' + voteClassName} />}

      {isRepresentative && (
        <span className={styles.user_votes + ' ' + communityVoteClassName} />
      )}
    </div>
  )
}

function ProposalDescription(props) {
  return (
    <div className={styles.proposal_description}>
      <ProposalDescriptionIntro id={props.id} proposal={props.proposal} />{' '}
      <ProposalDescriptionContent proposal={props.proposal} />{' '}
      <ProposalVotesSummary proposal={props.proposal} />
    </div>
  )
}

function ProposalDescriptionIntro(props) {
  // Get the proposal title and description
  const title = hexToString(props.proposal.title)
  const description = hexToString(props.proposal.description)

  // Try to extract an ipfs path from the proposal description
  const ipfsPath = description.split('/')[2]

  return (
    <>
      <p>
        <span className={styles.proposal_id}>#{props.id}</span>
        <span className={styles.proposal_title}>{title}</span>
      </p>
      <p>
        Issuer:{' '}
        <TezosAddressLink address={props.proposal.issuer} useAlias shorten />
      </p>
      <p>
        Description:{' '}
        {ipfsPath ? <IpfsLink path={ipfsPath}>ipfs</IpfsLink> : description}
      </p>
    </>
  )
}

function ProposalDescriptionContent(props) {
  // Write a different proposal description depending of the proposal kind
  const proposal = props.proposal

  if (proposal.kind.text) {
    return <p>Effect: Approves a text proposal.</p>
  } else if (proposal.kind.transfer_mutez) {
    // Extract the transfers information
    const transfers = proposal.kind.transfer_mutez
    const totalAmount = transfers.reduce(
      (previous, current) => previous + parseInt(current.amount),
      0
    )

    if (transfers.length === 1) {
      return (
        <p>
          Effect: Transfers {transfers[0].amount / 1000000} ꜩ to{' '}
          <TezosAddressLink
            address={transfers[0].destination}
            useAlias
            shorten
          />
          .
        </p>
      )
    } else {
      return (
        <>
          <p>Effect: Transfers {totalAmount / 1000000} ꜩ.</p>
          <details>
            <summary>See transfer details</summary>
            <table>
              <tbody>
                {transfers.map((transfer, index) => (
                  <tr key={index}>
                    <td>{transfer.amount / 1000000} ꜩ to</td>
                    <td>
                      <TezosAddressLink
                        address={transfer.destination}
                        useAlias
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
  } else if (proposal.kind.transfer_token) {
    // Extract the transfers information
    const fa2 = proposal.kind.transfer_token.fa2
    const tokenId = proposal.kind.transfer_token.token_id
    const transfers = proposal.kind.transfer_token.distribution
    const nEditions = transfers.reduce(
      (previous, current) => previous + parseInt(current.amount),
      0
    )
    const token = TOKENS.find((token) => token.fa2 === fa2)

    if (transfers.length === 1) {
      return (
        <p>
          Effect: Transfers{' '}
          {token ? transfers[0].amount / token.decimals : transfers[0].amount}{' '}
          {token?.multiasset
            ? `edition${transfers[0].amount > 1 ? 's' : ''} of token`
            : ''}{' '}
          <TokenLink fa2={fa2} id={tokenId}>
            {token ? (token.multiasset ? '#' + tokenId : token.name) : 'tokens'}
          </TokenLink>{' '}
          to{' '}
          <TezosAddressLink
            address={transfers[0].destination}
            useAlias
            shorten
          />
          .
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
                        useAlias
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
    const michelsonCode = parser.parseJSON(
      JSON.parse(proposal.kind.lambda_function)
    )
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

  // Get the proposal governance parameters
  const proposalGovernanceParameters =
    governanceParameters[props.proposal.gp_index]

  // Calculate the sum of the token and representatives votes
  let totalVotes = parseInt(props.proposal.token_votes.total)
  let positiveVotes = parseInt(props.proposal.token_votes.positive)
  let negativeVotes = parseInt(props.proposal.token_votes.negative)
  let abstainVotes = parseInt(props.proposal.token_votes.abstain)

  if (props.proposal.representatives_votes.total > 0) {
    const share = Math.min(
      proposalGovernanceParameters.representatives_share,
      props.proposal.representatives_votes.total *
        proposalGovernanceParameters.representative_max_share
    )
    const representativesTotalVotes = Math.floor(
      (props.proposal.quorum * share) / 100
    )
    totalVotes += representativesTotalVotes
    positiveVotes += Math.floor(
      (representativesTotalVotes *
        props.proposal.representatives_votes.positive) /
        props.proposal.representatives_votes.total
    )
    negativeVotes += Math.floor(
      (representativesTotalVotes *
        props.proposal.representatives_votes.negative) /
        props.proposal.representatives_votes.total
    )
    abstainVotes += Math.floor(
      (representativesTotalVotes *
        props.proposal.representatives_votes.abstain) /
        props.proposal.representatives_votes.total
    )
  }

  // Check if the proposal passes the quorum and supermajority
  const quorum = props.proposal.quorum
  const supermajority = proposalGovernanceParameters.supermajority / 100
  const passesQuorum = totalVotes > quorum
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
    : negativeVotes === 0
    ? voteScaling
    : (negativeVotes * supermajority) / (1 - supermajority) - positiveVotes

  return (
    <div className={styles.proposal_votes_summary}>
      <VotesDisplay
        title="Token votes:"
        yes={props.proposal.token_votes.positive / voteScaling}
        no={props.proposal.token_votes.negative / voteScaling}
        abstain={props.proposal.token_votes.abstain / voteScaling}
      />
      <VotesDisplay
        title="Representatives votes:"
        yes={props.proposal.representatives_votes.positive}
        no={props.proposal.representatives_votes.negative}
        abstain={props.proposal.representatives_votes.abstain}
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
  const userCommunity =
    userAddress && representatives ? representatives[userAddress] : undefined
  const userVotes = useUserVotes(userAddress, daoStorage)
  const communityVotes = useCommunityVotes(userCommunity, daoStorage)

  // Get the contract call methods from the user store
  const voteProposal = useUserStore((st) => st.voteProposal)
  const voteProposalAsRepresentative = useUserStore(
    (st) => st.voteProposalAsRepresentative
  )
  const cancelProposal = useUserStore((st) => st.cancelProposal)
  const evaluateVotingResult = useUserStore((st) => st.evaluateVotingResult)
  const executeProposal = useUserStore((st) => st.executeProposal)

  // Check if the user is a DAO member
  const isMember = userTokenBalance > 0

  // Check if the user is a community representative
  const isRepresentative = userCommunity !== undefined

  // Check if the user is the proposal issuer
  const isProposalIssuer = props.proposal.issuer === userAddress

  // Check if the user can vote proposals
  const userCanVote =
    userTokenBalance >=
    governanceParameters[props.proposal.gp_index].min_amount /
      DAO_TOKEN_DECIMALS

  return (
    <div className={styles.proposal_actions}>
      {props.canVote && userCanVote && !userVotes[props.id] && (
        <div>
          <p>Vote with your tokens:</p>
          <div className={styles.proposal_actions_buttons}>
            <Button shadow_box onClick={() => voteProposal(props.id, 'yes')}>
              yes
            </Button>
            <Button shadow_box onClick={() => voteProposal(props.id, 'no')}>
              no
            </Button>
            <Button
              shadow_box
              onClick={() => voteProposal(props.id, 'abstain')}
            >
              abstain
            </Button>
          </div>
        </div>
      )}

      {props.canVote &&
        isRepresentative &&
        communityVotes &&
        !communityVotes[props.id] && (
          <div>
            <p>Vote as representative:</p>
            <div className={styles.proposal_actions_buttons}>
              <Button
                shadow_box
                onClick={() => voteProposalAsRepresentative(props.id, 'yes')}
              >
                yes
              </Button>
              <Button
                shadow_box
                onClick={() => voteProposalAsRepresentative(props.id, 'no')}
              >
                no
              </Button>
              <Button
                shadow_box
                onClick={() =>
                  voteProposalAsRepresentative(props.id, 'abstain')
                }
              >
                abstain
              </Button>
            </div>
          </div>
        )}

      {props.canCancel &&
        isProposalIssuer &&
        !props.canEvaluate &&
        !props.canExecute && (
          <div className={styles.proposal_actions_buttons}>
            <Button shadow_box onClick={() => cancelProposal(props.id, true)}>
              cancel
            </Button>
          </div>
        )}

      {props.canEvaluate && isMember && (
        <div className={styles.proposal_actions_buttons}>
          {props.canCancel && isProposalIssuer && (
            <Button shadow_box onClick={() => cancelProposal(props.id, true)}>
              cancel
            </Button>
          )}
          <Button shadow_box onClick={() => evaluateVotingResult(props.id)}>
            evaluate
          </Button>
        </div>
      )}

      {props.canExecute && isMember && (
        <div className={styles.proposal_actions_buttons}>
          {props.canCancel && isProposalIssuer && (
            <Button shadow_box onClick={() => cancelProposal(props.id, true)}>
              cancel
            </Button>
          )}
          <Button shadow_box onClick={() => executeProposal(props.id)}>
            execute
          </Button>
        </div>
      )}
    </div>
  )
}
