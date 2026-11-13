import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { POLLS_CONTRACT, QUIPUSWAP_TEIA_URL } from '@constants'
import { Line } from '@atoms/line'
import { useStorage, usePolls } from '@data/swr'
import Tour, { TourLink } from '@components/tour'
import LoadingPollsMessage from '../LoadingPollsMessage'
import Poll from '../Poll'
import styles from '@style'

const POLL_STATUS_OPTIONS = {
  active: 'Active',
  finished: 'Past Polls',
}

const TOUR = [
  {
    target: 'polls-active',
    text: 'Polls still open for voting. You can change your vote until the poll ends.',
  },
  {
    target: 'polls-finished',
    text: 'Closed polls and their final results. These can no longer be voted on.',
  },
]

export default function Polls() {
  // Set the component state
  const [selectedStatus, setSelectedStatus] = useState('active')

  // Start the tabs tour on every visit; Done or close ends it
  const [params, setParams] = useSearchParams()
  useEffect(() => {
    if (params.get('tour')) return
    params.set('tour', 'polls')
    setParams(params, { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
      <Tour name="polls" steps={TOUR} />
      <div className={styles.status_tabs}>
        {Object.entries(POLL_STATUS_OPTIONS).map(([status, label]) => (
          <button
            key={status}
            data-tour={`polls-${status}`}
            className={`${styles.status_tab} ${
              selectedStatus === status ? styles.selected : ''
            }`}
            onClick={() => setSelectedStatus(status)}
          >
            {label} ({pollIdsByStatus[status].length})
          </button>
        ))}
        <TourLink name="polls" title="How poll tabs work" />
      </div>
      <h1 className={styles.section_title}>Teia Polls</h1>
      <p>
        Teia's polling system is a community tool that any Teia member can use
        for any purpose - it is often used for feature requests, testing
        interest or getting feedback for ideas (artistic or technical),
        measuring community sentiment around certain issues, or just for fun.
      </p>
      <p>
        Teia DAO tokens are governance tokens only. They are not tokens that
        provide any financial benefit.
      </p>
      <p>
        To start or participate in a poll, the wallet sync'd must have at least
        one $TEIA token, which is on the Tezos (XTZ) chain. If you're interested
        in acquiring $TEIA, you can read the guide <a href="/dao">here</a>, or
        connect with a Teia Team Member to learn more.
      </p>
      <p>
        <a href={QUIPUSWAP_TEIA_URL} target="_blank" rel="noreferrer">
          Convert XTZ to $TEIA on Quipuswap (Decentralized Exchange)
        </a>
      </p>
      <p>
        <strong>How Polls Work:</strong>
      </p>
      <p>
        One Teia DAO token is needed in order to launch a poll or to vote.
        Tokens are not consumed by this process, they serve as a feature access
        token for polls.
      </p>
      <p>
        Use Teia DAO tokens to vote, only one vote per person will be counted.
        Only the most recent selection will be counted, so if you wish to change
        your vote to a different option, you can.
      </p>
      <p>
        The wallet will only be eligible to vote if it had $TEIA at the time of
        poll creation. If a Teia DAO Token was not in the wallet prior to the
        poll creation, it will return an error.
      </p>
      <p>
        We are replacing the discussion forum with our own system. More info
        soon.
      </p>
      <Line />

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
