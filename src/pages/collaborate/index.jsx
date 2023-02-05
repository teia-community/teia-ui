import { Page } from '@atoms/layout'
import { CollabDisplay } from '@components/collab/show/CollabDisplay'
import { CreateCollaboration } from './create'
import { CollabContractsOverview } from './manage'
import { Tabs } from '@atoms/tab/Tabs'
import { Outlet } from 'react-router'
import styles from '@style'
/**@type {import('@atoms/tab/Tabs').TabOptions} */
const TABS = [
  { title: 'Manage', to: '' },
  { title: 'Create', to: 'create' },
]

const Collaborate = () => {
  // We watch for this being created so we can change from create to manage
  // const { originationOpHash, banner } = useContext(TeiaContext)

  // const { action } = useParams()

  // TODO(mel): change tab on collab creation
  // If an address is created, update the tab
  // useEffect(() => {
  //   console.debug({ originationOpHash })
  //   if (originationOpHash) {
  //     setTabIndex(0)
  //   }
  // }, [originationOpHash])

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
