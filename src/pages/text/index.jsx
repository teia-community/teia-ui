import { Outlet } from 'react-router-dom'
import { Page } from '@atoms/layout'
import { Tabs } from '@atoms/tab'
import { useUserStore } from '@context/userStore'
import styles from '@style'

const TABS = [
  { title: 'Community', to: '' },
  { title: 'Bulletin', to: 'bulletin' },
  { title: 'Your Posts', to: 'yourposts', private: true },
  { title: 'New Post', to: 'newpost', private: true },
]

export default function Text() {
  const address = useUserStore((st) => st.address)

  return (
    <Page title="Teia Text">
      <div className={styles.container}>
        <h1 className={styles.headline}>Text</h1>
        <Tabs
          tabs={TABS}
          filter={(tab) => {
            if (!address && tab.private) return null
            return tab
          }}
        />
        <div className={styles.tab_content}>
          <Outlet />
        </div>
      </div>
    </Page>
  )
}
