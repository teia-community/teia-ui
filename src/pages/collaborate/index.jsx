import React from 'react'
import { Page } from '@atoms/layout'
import { CollabDisplay } from '@components/collab/show/CollabDisplay'
import { CreateCollaboration } from './create'
import { CollabContractsOverview } from './manage'
import { Tabs } from '@atoms/tab/Tabs'

const TABS = [
  { title: 'Manage', component: CollabContractsOverview },
  { title: 'Create', component: CreateCollaboration },
]

const Collaborate = () => {
  // We watch for this being created so we can change from create to manage
  // const { originationOpHash, banner } = useContext(TeiaContext)

  // const { action } = useParams()

  // TODO(mel): change tab
  // If an address is created, update the tab
  // useEffect(() => {
  //   console.debug({ originationOpHash })
  //   if (originationOpHash) {
  //     setTabIndex(0)
  //   }
  // }, [originationOpHash])

  return (
    <Page title="proxy">
      <Tabs tabs={TABS} />
    </Page>
  )
}

export {
  Collaborate,
  CollabDisplay,
  CreateCollaboration,
  CollabContractsOverview,
}
