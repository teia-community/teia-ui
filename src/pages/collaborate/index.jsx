import { Page } from '@atoms/layout'
import { CollabDisplay } from '@components/collab/show/CollabDisplay'
import { CreateCollaboration } from './create'
import { CollabContractsOverview } from './manage'
import { Tabs } from '@atoms/tab/Tabs'
import { Outlet, useNavigate } from 'react-router'
import styles from '@style'
import { useCollabStore } from '@context/collabStore'
import { useEffect } from 'react'
/**@type {import('@atoms/tab/Tabs').TabOptions} */
const TABS = [
  { title: 'Manage', to: '' },
  { title: 'Create', to: 'create' },
]

const Collaborate = () => {
  // We watch for this being created so we can change from create to manage
  const navigate = useNavigate()

  // const { action } = useParams()

  // If an address is created, update the tab
  useEffect(() => {
    const clb = (originationOpHash) => {
      console.debug({ originationOpHash })
      if (originationOpHash) {
        navigate('/')
      }
    }
    const unsubscribe = useCollabStore.subscribe(
      (st) => st.originationOpHash,
      clb
    )
    return unsubscribe
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <Page title="proxy">
      <Tabs className={styles.tabs} tabs={TABS} />
      <Outlet />
    </Page>
  )
}

export {
  Collaborate,
  CollabDisplay,
  CreateCollaboration,
  CollabContractsOverview,
}
