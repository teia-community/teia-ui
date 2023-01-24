//tabs [{title:string, component:ReactComponent}]

import { useMemo, useState } from 'react'
import { Tab } from './index'

export const Tabs = ({ tabs }) => {
  const [tabIndex, setTabIndex] = useState(0)

  const Component = useMemo(() => tabs[tabIndex].component, [tabIndex, tabs])

  return (
    <div>
      {tabs.map((tab, index) => (
        <Tab
          key={tab.title}
          selected={tabIndex === index}
          onClick={() => setTabIndex(index)}
        >
          {tab.title}
        </Tab>
      ))}
      <Component />
    </div>
  )
}
