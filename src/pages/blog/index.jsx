import { Outlet } from 'react-router-dom'
import { Page } from '@atoms/layout'
import { Tabs } from '@atoms/tab'
import { useUserStore } from '@context/userStore'
import styles from '@style'

const TABS = [
  { title: 'Community', to: '' },
  { title: 'Your Posts', to: 'yourposts', private: true },
  { title: 'New Post', to: 'newpost', private: true },
]

export default function Blog() {
  const address = useUserStore((st) => st.address)

  return (
    <Page title="Teia Blog">
      <div className={styles.container}>
        <h1 className={styles.headline}>Blog</h1>
        <Tabs
          tabs={TABS}
          filter={(tab) => {
            if (!address && tab.private) return null
            return tab
          }}
        />
        <Outlet />
      </div>
    </Page>
  )
}
