import { useState } from 'react'
import { POLLS_CONTRACT, DAO_TOKEN_DECIMALS } from '@constants'
import { useUserStore } from '@context/userStore'
import { usePollsStore } from '@context/pollsStore'
import { Button } from '@atoms/button'
import { Line } from '@atoms/line'
import { Select } from '@atoms/select'
import { TeiaUserLink, IpfsLink } from '@atoms/link'
import {
  useStorage,
  usePolls,
  useUserPollVotes,
  useDaoTokenBalance,
  usePollsUsersAliases,
} from '@data/swr'
import { hexToString } from '@utils/string'
import { getWordDate } from '@utils/time'
import styles from '@style'

const POLL_STATUS_OPTIONS = {
  active: 'Active polls',
  finished: 'Finished polls',
}

export default function Polls() {
  // Set the component state
  const [selectedStatus, setSelectedStatus] = useState('active')

  // Get all the required polls information
  const [pollsStorage] = useStorage(POLLS_CONTRACT)
  const [polls] = usePolls(pollsStorage)

  // Separate the polls depending of their current status
  const pollsByStatus = Object.fromEntries(
    Object.keys(POLL_STATUS_OPTIONS).map((status) => [status, []])
  )

  if (polls) {
    const now = new Date()

    for (const pollId of Object.keys(polls).reverse()) {
      // Calculate the poll expiration time
      const poll = polls[pollId]
      const votePeriod = parseInt(poll.vote_period)
      const voteExpirationTime = new Date(poll.timestamp)
      voteExpirationTime.setDate(voteExpirationTime.getDate() + votePeriod)

      // Save all the information inside the poll
      poll.id = pollId
      poll.voteExpirationTime = voteExpirationTime
      poll.voteFinished = now > voteExpirationTime

      // Classify the poll according to their status
      if (poll.voteFinished) {
        pollsByStatus.finished.push(poll)
      } else {
        pollsByStatus.active.push(poll)
      }
    }
  }

  return (
    <section className={styles.section}>
      <h1 className={styles.section_title}>Teia polls</h1>

      <Select
        alt="poll group selection"
        value={{
          value: selectedStatus,
          label: `${POLL_STATUS_OPTIONS[selectedStatus]} (${pollsByStatus[selectedStatus].length})`,
        }}
        onChange={(e) => setSelectedStatus(e.value)}
        options={Object.entries(POLL_STATUS_OPTIONS).map(([value, label]) => ({
          value: value,
          label: `${label} (${pollsByStatus[value].length})`,
        }))}
      >
        <Line />
      </Select>

      <PollGroup
        status={selectedStatus}
        polls={pollsByStatus[selectedStatus]}
      />
    </section>
  )
}

function PollGroup({ status, polls }) {
  switch (status) {
    case 'active':
      return (
        <>
          {polls.length > 0 ? (
            <>
              <p>These polls are still active.</p>
              <p>You can modify your previous vote if you want.</p>
            </>
          ) : (
            <p>There are no active polls to vote at the moment.</p>
          )}
          <PollList polls={polls} active />
        </>
      )
    case 'finished':
      return (
        <>
          <p>These polls are closed and cannot be voted anymore.</p>
          <PollList polls={polls} />
        </>
      )
    default:
      return
  }
}

function PollList({ polls, active }) {
  if (polls.length !== 0) {
    return (
      <ul>
        {polls.map((poll, index) => (
          <li key={index}>
            <Poll poll={poll} active={active} />
            {index !== polls.length - 1 && <Line />}
          </li>
        ))}
      </ul>
    )
  }
}

function Poll({ poll, active }) {
  // Get all the required polls information
  const [pollsStorage] = useStorage(POLLS_CONTRACT)
  const [polls, updatePolls] = usePolls(pollsStorage)

  // Get all the required user information
  const userAddress = useUserStore((st) => st.address)
  const [userVotes, updateUserVotes] = useUserPollVotes(
    userAddress,
    pollsStorage
  )
  const [userTokenBalance] = useDaoTokenBalance(userAddress)

  // Get all the relevant users aliases
  const [usersAliases] = usePollsUsersAliases(userAddress, polls)

  // Define the callback function to be triggered when the user interacts
  const callback = () => {
    updatePolls()
    updateUserVotes()
  }

  // Try to extract an ipfs cid from the poll description
  const description =
    poll.description !== '' ? hexToString(poll.description) : ''
  const cid = description.split('//')[1]

  return (
    <div className={styles.poll}>
      <h3 className={styles.poll_question}>
        <span className={styles.poll_id}>#{poll.id}</span>
        {hexToString(poll.question)}
      </h3>

      <p>
        Created by{' '}
        <TeiaUserLink
          address={poll.issuer}
          alias={usersAliases?.[poll.issuer]}
          shorten
        />{' '}
        on {getWordDate(poll.timestamp)}.
      </p>

      {!poll.voteFinished && (
        <p>Voting period ends on {getWordDate(poll.voteExpirationTime)}.</p>
      )}

      {description !== '' && (
        <p>
          Description:{' '}
          {cid ? <IpfsLink cid={cid}>Open file in ipfs</IpfsLink> : description}
        </p>
      )}

      <p>Vote weight method: {Object.keys(poll.vote_weight_method)[0]}</p>

      <p>Options to vote:</p>
      <PollOptions
        poll={poll}
        userVotedOption={userVotes?.[poll.id]?.option}
        active={active && userTokenBalance > 0}
        callback={callback}
      />
    </div>
  )
}

function PollOptions({ poll, userVotedOption, active, callback }) {
  // Set the component state
  const [showPercents, setShowPercents] = useState(false)

  // Get the vote poll method from the polls store
  const votePoll = usePollsStore((st) => st.votePoll)

  // Calculate the total and maximum number of votes
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
    <ul className={styles.poll_options}>
      {Object.entries(poll.votes_count).map(([option, optionVotes]) => (
        <li
          key={option}
          className={`${styles.poll_option} ${
            parseInt(optionVotes) === maxVotes ? styles.winner : ''
          }`}
        >
          <button onClick={() => setShowPercents(!showPercents)}>
            <div>
              {userVotedOption === option ? <span>&nbsp;&nbsp;</span> : ''}
              {hexToString(poll.options[option])}
              {userVotedOption === option ? ' \u2714' : ''}
            </div>
            <div>
              {showPercents
                ? `${Math.round((100 * optionVotes) / totalVotes)}%`
                : `${Math.round(optionVotes / voteScaling)} vote${
                    parseInt(optionVotes) !== voteScaling ? 's' : ''
                  }`}
            </div>
          </button>
          {active && (
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
  )
}
