import { Outlet } from 'react-router-dom'
import { Page } from '@atoms/layout'
import { Tabs } from '@atoms/tab'
import { useUserStore } from '@context/userStore'
import { useMessagingStorage } from '@data/messaging'
import styles from '@style'

const TABS = [
  { title: 'Inbox', to: '' },
  { title: 'Compose', to: 'compose', private: true },
]

export default function Messages() {
  const address = useUserStore((st) => st.address)
  const [storage] = useMessagingStorage()

  return (
    <Page title="Messages">
      <div className={styles.container}>
        <h1 className={styles.headline}>Messages</h1>

        <Tabs
          tabs={TABS}
          filter={(tab) => {
            if (tab.private && !address) return null
            return tab
          }}
        />

        <Outlet context={{ storage, address }} />
      </div>
    </Page>
  )
}
