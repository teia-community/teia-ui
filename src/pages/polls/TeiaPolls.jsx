import { Outlet } from 'react-router-dom'
import { POLLS_CONTRACT } from '@constants'
import { Page } from '@atoms/layout'
import { Tabs } from '@atoms/tab'
import { useStorage, usePolls } from '@data/swr'
import LoadingPollsMessage from './LoadingPollsMessage'
import styles from '@style'

const TABS = [
  {
    title: 'Polls',
    to: '',
  },
  {
    title: 'Create',
    to: 'create',
  },
]

export default function TeiaPolls() {
  // Get all the required teia polls information
  const [pollsStorage] = useStorage(POLLS_CONTRACT)
  const [polls] = usePolls(pollsStorage)

  return (
    <Page title="Teia Polls">
      <div className={styles.container}>
        <h1 className={styles.headline}>Teia Community Polls</h1>

        {!polls ? (
          <LoadingPollsMessage />
        ) : (
          <>
            <Tabs tabs={TABS} />

            <Outlet />
          </>
        )}
      </div>
    </Page>
  )
}
