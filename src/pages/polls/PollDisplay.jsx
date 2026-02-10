import { useParams } from 'react-router-dom'
import { bytes2Char } from '@taquito/utils'
import { PATH, POLLS_CONTRACT } from '@constants'
import { Page } from '@atoms/layout'
import { RootErrorBoundary } from '@atoms/error'
import { PaginationButtons } from '@atoms/button'
import { useStorage, usePolls } from '@data/swr'
import LoadingPollsMessage from './LoadingPollsMessage'
import Poll from './Poll'
import styles from '@style'

export default function PollDisplay() {
  // Get all the required polls information
  const [pollsStorage] = useStorage(POLLS_CONTRACT)
  const [polls] = usePolls(pollsStorage)

  // Get the poll id from the url
  const { id } = useParams()

  // Return an error if the poll doesn't exist
  if (polls && !polls[id]) {
    return (
      <RootErrorBoundary
        title="Wrong poll id"
        msg={`The last Teia poll id is ${pollsStorage.counter - 1}`}
      />
    )
  }

  // We are replaying our discourse system.

  return (
    <Page title={`Teia poll #${id}`}>
      <div className={styles.container}>
        <h1 className={styles.headline}>Teia poll</h1>
        {!polls ? (
          <LoadingPollsMessage message="Loading poll information" />
        ) : (
          <>
            <section className={styles.section}>
              <Poll pollId={id} />
            </section>

            <PaginationButtons
              path={PATH.POLL}
              current={parseInt(id)}
              min={0}
              max={pollsStorage.counter - 1}
            />
          </>
        )}
      </div>
    </Page>
  )
}
