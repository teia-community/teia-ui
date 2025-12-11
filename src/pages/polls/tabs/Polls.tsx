import { useState } from 'react'
import { POLLS_CONTRACT } from '@constants'
import { Line } from '@atoms/line'
import { Select } from '@atoms/select'
import { useStorage, usePolls } from '@data/swr'
import LoadingPollsMessage from '../LoadingPollsMessage'
import Poll from '../Poll'
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

  // Display the loading page information until all data is available
  if (!polls) {
    return <LoadingPollsMessage />
  }

  // Separate the poll ids depending of their current status
  const pollIdsByStatus = {
    active: [] as string[],
    finished: [] as string[],
  }

  const now = new Date()

  for (const pollId of Object.keys(polls).reverse()) {
    // Calculate the poll expiration time
    const poll = polls[pollId]
    const votePeriod = parseInt(poll.vote_period)
    const voteExpirationTime = new Date(poll.timestamp)
    voteExpirationTime.setDate(voteExpirationTime.getDate() + votePeriod)

    // Classify the poll according to their status
    if (now > voteExpirationTime) {
      pollIdsByStatus.finished.push(pollId)
    } else {
      pollIdsByStatus.active.push(pollId)
    }
  }

  return (
    <section className={styles.section}>
      <h1 className={styles.section_title}>Teia Polls</h1>
      <p>
        TEIA's polling system is a community tool that any TEIA member can use
        for any purpose - it is often used for feature requests, testing
        interest or getting feedback for ideas (artistic or technical),
        measuring community sentiment around certain issues, or just for fun.
      </p>
      <p>
        To start or participate in a poll, the wallet sync'd must have a
        non-zero amount of TEIA tokens, which is a on the Tezos (XTZ) chain. If
        you're interested in acquiring $TEIA, you can read the guide{' '}
        <a href="/dao">here.</a>
      </p>
      <p>
        Use Teia DAO tokens to vote, only one vote per person will be counted.
      </p>
      <p>
        The wallet will only be eligible to vote if it had $TEIA at the time of
        poll creation.
      </p>
      <p>
        To discuss the details of polls or proposals, you can use{' '}
        <a href="https://discourse.teia.art/" target="_blank" rel="noreferrer">
          this forum
        </a>{' '}
        to start a new thread with the poll number and title as the reference.
        (Note that this is a third-party service and will not get recorded
        "officially" on-chain.)
      </p>
      <p>
        <a
          href="https://quipuswap.com/swap/tez-KT1QrtA753MSv8VGxkDrKKyJniG5JtuHHbtV_0"
          target="_blank"
          rel="noreferrer"
        >
          Convert XTZ to TEIA on Quipuswap (Decentralized Exchange)
        </a>
      </p>
      <Line />
      <Select
        alt="poll group selection"
        value={{
          value: selectedStatus,
          label: `${POLL_STATUS_OPTIONS[selectedStatus]} (${pollIdsByStatus[selectedStatus].length})`,
        }}
        onChange={(e) => setSelectedStatus(e.value)}
        options={Object.entries(POLL_STATUS_OPTIONS).map(([status, label]) => ({
          value: status,
          label: `${label} (${pollIdsByStatus[status].length})`,
        }))}
      >
        <Line />
      </Select>

      <PollGroup
        status={selectedStatus}
        pollIds={pollIdsByStatus[selectedStatus]}
      />
    </section>
  )
}

function PollGroup({ status, pollIds }) {
  const groupIntroduction = (() => {
    switch (status) {
      case 'active':
        return pollIds.length > 0
          ? 'These polls are still active. You can modify your previous vote if you want.'
          : 'There are no active polls to vote at the moment.'
      case 'finished':
        return 'These polls are closed and cannot be voted anymore.'
      default:
        return ''
    }
  })()

  return (
    <>
      <p>{groupIntroduction}</p>

      {pollIds.length > 0 && (
        <ul>
          {pollIds.map((pollId, index) => (
            <li key={pollId}>
              <Poll pollId={pollId} />

              {index < pollIds.length - 1 && <Line />}
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
