//tabs [{title:string, component:ReactComponent}]

import { useMemo, useState } from 'react'
import { Tab } from './index'
import styles from '@style'
import { Line } from '@atoms/line/index'

// function Tab({ children, to }) {
//   return (
//     <NavLink
//       style={({ isActive }) =>
//         isActive
//           ? {
//               textDecoration: 'underline',
//             }
//           : undefined
//       }
//       className="tag"
//       to={to}
//       end
//     >
//       {children}
//     </NavLink>
//   )
// }

/**
 * A taboption object
 * @typedef {{title:string,component?:import('react').ReactElement, to?:string}} TabOptions
 */

/**
 * Core Tabs
 * @param {Object} tabsProps
 * @param {[TabOptions]} tabsProps.tabs - The text or icon used for the toggle
 * @param {(tab:TabOptions, index:number) => [TabOptions] } tabsProps.filter - A method to filter out the tabs
 *
 */
export const Tabs = ({ tabs, className, filter, props = {} }) => {
  const filtered_tabs = useMemo(
    () => (filter ? tabs.map(filter) : tabs),
    [tabs, filter]
  )
  const [tabIndex, setTabIndex] = useState(0)

  const Component = useMemo(() => tabs[tabIndex]?.component, [tabIndex, tabs])

  return (
    <div className={`${styles.container} ${className ? className : ''}`}>
      <div className={styles.tabs}>
        {filtered_tabs.map((tab, index) =>
          tab ? (
            <Tab
              key={tab.title}
              selected={tab?.to === undefined ? tabIndex === index : null}
              onClick={() => setTabIndex(index)}
              to={tab?.to}
            >
              {tab.title}
            </Tab>
          ) : (
            ''
          )
        )}
      </div>
      <Line className={styles.line} />
      {Component && <Component {...props} />}
    </div>
  )
}
