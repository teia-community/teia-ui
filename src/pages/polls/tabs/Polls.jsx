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
  const pollIdsByStatus = Object.fromEntries(
    Object.keys(POLL_STATUS_OPTIONS).map((status) => [status, []])
  )
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
      <h1 className={styles.section_title}>Teia polls</h1>

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
