//tabs [{title:string, component:ReactComponent}]

import { useMemo } from 'react'
import styles from '@style'
import { Line } from '@atoms/line'
import Button from '@atoms/button/Button'

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
 * @typedef {{title:string, to?:string}} TabOptions
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

  return (
    <div className={`${styles.container} ${className ? className : ''}`}>
      <div className={styles.tabs}>
        {filtered_tabs.map((tab, index) =>
          tab ? (
            <Button
              preventScrollReset
              key={tab.title}
              className={styles.tab}
              activeClass={styles.active}
              to={tab?.to}
            >
              {tab.title}
            </Button>
          ) : (
            ''
          )
        )}
      </div>
      <Line className={styles.line} />
    </div>
  )
}
