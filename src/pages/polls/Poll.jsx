import { useState } from 'react'
import { Link } from 'react-router-dom'
import { bytes2Char } from '@taquito/utils'
import { PATH, POLLS_CONTRACT, DAO_TOKEN_DECIMALS } from '@constants'
import { useUserStore } from '@context/userStore'
import { usePollsStore } from '@context/pollsStore'
import { Button } from '@atoms/button'
import { TeiaUserLink, IpfsLink, DefaultLink } from '@atoms/link'
import { RenderMediaType } from '@components/media-types'
import {
  useStorage,
  usePolls,
  useDaoTokenBalance,
  useUserPollVotes,
  usePollsUsersAliases,
  useObjkt,
} from '@data/swr'
import { getWordDate } from '@utils/time'
import styles from '@style'

export default function Poll({ pollId }) {
  // Get all the required teia polls information
  const [pollsStorage] = useStorage(POLLS_CONTRACT)
  const [polls, updatePolls] = usePolls(pollsStorage)

  // Get all the required user information
  const userAddress = useUserStore((st) => st.address)
  const [userTokenBalance] = useDaoTokenBalance(userAddress)
  const [userVotes, updateUserVotes] = useUserPollVotes(
    userAddress,
    pollsStorage
  )

  // Get all the relevant users aliases
  const [usersAliases] = usePollsUsersAliases(userAddress, polls)

  // Return if we are missing important information
  if (!polls) {
    return
  }

  // Check if the poll vote period finished
  const poll = polls[pollId]
  const votePeriod = parseInt(poll.vote_period)
  const voteExpirationTime = new Date(poll.timestamp)
  voteExpirationTime.setDate(voteExpirationTime.getDate() + votePeriod)
  const now = new Date()
  const voteFinished = now > voteExpirationTime

  // Save the information inside the poll
  poll.id = pollId
  poll.voteExpirationTime = voteExpirationTime
  poll.voteFinished = voteFinished

  return (
    <div className={styles.poll}>
      <h3 className={styles.poll_question}>
        <Link
          aria-label={`Poll ${pollId}`}
          to={`${PATH.POLL}/${pollId}`}
          className={styles.poll_id}
        >
          #{pollId}
        </Link>
        {bytes2Char(poll.question)}
      </h3>

      <PollDescription poll={poll} aliases={usersAliases} />

      <PollVotesSummary
        poll={poll}
        userVotedOption={userVotes?.[pollId]?.option}
        canVote={!voteFinished && userTokenBalance > 0}
        callback={() => {
          updatePolls()
          updateUserVotes()
        }}
      />
    </div>
  )
}

function PollDescription({ poll, aliases }) {
  // Try to extract an ipfs cid from the poll description
  const description =
    poll.description !== '' ? bytes2Char(poll.description) : ''
  const cid = description.split('//')[1]

  return (
    <>
      <p>
        Created by{' '}
        <TeiaUserLink
          address={poll.issuer}
          alias={aliases?.[poll.issuer]}
          shorten
        />{' '}
        on {getWordDate(poll.timestamp)}.
      </p>

      {!poll.voteFinished && (
        <p>Voting period ends on {getWordDate(poll.voteExpirationTime)}.</p>
      )}

      {description !== '' && (
        <p>
          Description: {cid ? <IpfsLink cid={cid}>IPFS</IpfsLink> : description}
        </p>
      )}

      <p>
        Vote weight method:{' '}
        {Object.keys(poll.vote_weight_method)[0].toUpperCase()}
      </p>
    </>
  )
}

function PollVotesSummary({ poll, userVotedOption, canVote, callback }) {
  // Set the component state
  const [showPercents, setShowPercents] = useState(false)

  // Get the vote poll method from the polls store
  const votePoll = usePollsStore((st) => st.votePoll)

  // Calculate the total and the maximum number of votes
  const votes = Object.values(poll.votes_count).map((value) => parseInt(value))
  const totalVotes = votes.reduce((acc, value) => acc + value, 0)
  const maxVotes = Math.max(...votes)

  // Calculate the vote scaling factor
  const voteScaling = poll.vote_weight_method.linear
    ? DAO_TOKEN_DECIMALS
    : poll.vote_weight_method.quadratic
    ? Math.pow(DAO_TOKEN_DECIMALS, 0.5)
    : 1

  return (
    <>
      <p>Options to vote:</p>
      <ul className={styles.poll_options}>
        {Object.entries(poll.votes_count).map(([option, optionVotes]) => (
          <li
            key={option}
            className={`${styles.poll_option} ${
              parseInt(optionVotes) === maxVotes && maxVotes !== 0
                ? styles.winner_option
                : ''
            }`}
          >
            <button onClick={() => setShowPercents(!showPercents)}>
              {userVotedOption === option ? (
                <div className={styles.poll_option_container}>
                  <span className={styles.user_vote}></span>
                  <PollOption option={bytes2Char(poll.options[option])} />
                  <span className={styles.user_vote}>{'\u2714'}</span>
                </div>
              ) : (
                <PollOption option={bytes2Char(poll.options[option])} />
              )}
              <div>
                {showPercents
                  ? `${
                      totalVotes === 0
                        ? 0
                        : Math.round((100 * optionVotes) / totalVotes)
                    }%`
                  : `${Math.round(optionVotes / voteScaling)} vote${
                      parseInt(optionVotes) !== voteScaling ? 's' : ''
                    }`}
              </div>
            </button>

            {canVote && (
              <Button
                onClick={() => votePoll(poll.id, option, null, callback)}
                shadow_box
                fit
              >
                Select
              </Button>
            )}
          </li>
        ))}
      </ul>
    </>
  )
}

function PollOption({ option }) {
  if (option.indexOf('http') >= 0) {
    return (
      <DefaultLink href={option.slice(option.indexOf('http'))}>
        {option.slice(0, option.indexOf('http')) || undefined}
      </DefaultLink>
    )
  } else if (option.indexOf('ipfs://') >= 0) {
    return <IpfsLink cid={option.split('ipfs://')[1]} />
  } else if (option.indexOf('OBJKT#') === 0) {
    return <ObjktOption id={option.split('#')[1]} />
  } else {
    return <span>{option}</span>
  }
}

function ObjktOption({ id }) {
  const [objkt] = useObjkt(id)

  return objkt ? (
    <div className={styles.poll_objkt_option}>
      <RenderMediaType nft={objkt} />
      <span>{`OBJKT#${id}`}</span>
    </div>
  ) : (
    <span>{`OBJKT#${id}`}</span>
  )
}
