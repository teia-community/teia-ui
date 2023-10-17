import { Outlet } from 'react-router-dom'
import { Page } from '@atoms/layout'
import { Tabs } from '@atoms/tab'
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

export function TeiaPolls() {
  return (
    <Page title="Teia polls">
      <div className={styles.container}>
        <h1 className={styles.headline}>Teia polls</h1>

        <Tabs tabs={TABS} />

        <Outlet />
      </div>
    </Page>
  )
}
