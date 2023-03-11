import { useMemo } from 'react'
import styles from '@style'
import { Line } from '@atoms/line'
import Button from '@atoms/button/Button'

/**
 * Core Tabs
 */
export const Tabs = ({
  tabs,
  className = '',
  filter /*onClickprops = {}*/,
}: TabsProps) => {
  const filtered_tabs = useMemo(
    () => (filter ? tabs.map(filter).filter((v) => v !== null) : tabs),
    [tabs, filter]
  )

  return (
    <div className={`${styles.container} ${className}`}>
      <div className={styles.tabs}>
        {filtered_tabs.map((tab, index) => {
          if (tab) {
            return (
              <Button
                alt={`tab_${tab.title}`}
                preventScrollReset
                key={index}
                className={styles.tab}
                activeClass={styles.active}
                disabled={tab.disabled}
                to={tab?.to}
              >
                {tab.title}
              </Button>
            )
          }
          return null
        })}
      </div>
      <Line className={styles.line} />
    </div>
  )
}
