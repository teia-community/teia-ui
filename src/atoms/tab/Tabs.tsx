import { useMemo } from 'react'
import styles from '@style'
import { Line } from '@atoms/line'
import Button from '@atoms/button/Button'
export interface TabOptions {
  title: string
  to?: string
  disabled?: boolean
  /**mod overrides */
  restricted?: boolean
  /**only relevant when user is the owner*/
  private?: boolean
}

interface TabsProps {
  tabs: TabOptions[]
  className?: string
  /**A method to filter out the tabs */
  filter?: (tabs: TabOptions) => TabOptions | null
}

/**
 * Core Tabs
 */
export const Tabs = ({
  tabs,
  className,
  filter /*onClickprops = {}*/,
}: TabsProps) => {
  const filtered_tabs = useMemo(
    () => (filter ? tabs.map(filter).filter((v) => v !== null) : tabs),
    [tabs, filter]
  )

  return (
    <div className={`${styles.container} ${className ? className : ''}`}>
      <div className={styles.tabs}>
        {filtered_tabs.map((tab, index) => {
          if (tab) {
            return (
              <Button
                alt={`tab_${tab.title}`}
                preventScrollReset
                key={tab.title}
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
