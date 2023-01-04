import React, { useContext, useEffect, useState } from 'react'
import { Page, Container } from '@atoms/layout'
import { Button, Primary } from '@atoms/button'
import { CollabDisplay } from '@components/collab/show/CollabDisplay'
import { CreateCollaboration } from './create'
import { TeiaContext } from '@context/TeiaContext'
import { CollabContractsOverview } from './manage'
import { useParams } from 'react-router'

const TABS = [
  { title: 'Manage', component: CollabContractsOverview },
  { title: 'Create', component: CreateCollaboration },
]

const Collaborate = () => {
  const [tabIndex, setTabIndex] = useState(0)
  const Tab = TABS[tabIndex].component

  // We watch for this being created so we can change from create to manage
  const { originationOpHash, banner } = useContext(TeiaContext)

  const { action } = useParams()

  useEffect(() => {
    const tabIndex = TABS.findIndex((t) => t.title === action)
    setTabIndex(Math.max(tabIndex, 0))
  }, [action])

  // If an address is created, update the tab
  useEffect(() => {
    console.log({ originationOpHash })
    if (originationOpHash) {
      setTabIndex(0)
    }
  }, [originationOpHash])

  return (
    <Page title="proxy" large={banner != null}>
      <Container>
        {TABS.map((tab, index) => {
          return (
            <Button key={tab.title} onClick={() => setTabIndex(index)}>
              <Primary selected={tabIndex === index}>{tab.title}</Primary>
            </Button>
          )
        })}
      </Container>
      <Tab />
    </Page>
  )
}

export {
  Collaborate,
  CollabDisplay,
  CreateCollaboration,
  CollabContractsOverview,
}
