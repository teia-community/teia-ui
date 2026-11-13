import { useMemo } from 'react'
import styles from '@style'
import { Line } from '@atoms/line'
import Button from '@atoms/button/Button'
import { TourLink } from '@components/tour'
export interface TabOptions {
  title: string
  to?: string
  disabled?: boolean
  /**mod overrides */
  restricted?: boolean
  /**only relevant when user is the owner*/
  private?: boolean
  /**name of a tour (see components/tour) opened by a "?" on the tab */
  tour?: string
  /**small count indicator after the title*/
  count?: number
}

interface TabsProps {
  tabs: TabOptions[]
  className?: string
  /**A method to filter out the tabs */
  filter?: (tabs: TabOptions) => TabOptions | null
  /**`data-tour` target for the row of tabs (see components/tour) */
  tourTarget?: string
}

/**
 * Core Tabs
 */
export const Tabs = ({
  tabs,
  className,
  filter /*onClickprops = {}*/,
  tourTarget,
}: TabsProps) => {
  const filtered_tabs = useMemo(
    () => (filter ? tabs.map(filter).filter((v) => v !== null) : tabs),
    [tabs, filter]
  )

  return (
    <div className={`${styles.container} ${className ? className : ''}`}>
      <div className={styles.tabs} data-tour={tourTarget}>
        {filtered_tabs.map((tab, index) => {
          if (tab) {
            const button = (
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
                {tab.count != null && (
                  <span className={styles.count}>{tab.count}</span>
                )}
              </Button>
            )
            if (!tab.tour) return button
            return (
              <span key={tab.title} className={styles.tab_wrap}>
                {button}
                <span className={styles.tab_tour}>
                  <TourLink
                    name={tab.tour}
                    path={tab.to || '.'}
                    title={`How ${tab.title} works`}
                  />
                </span>
              </span>
            )
          }
          return null
        })}
      </div>
      <Line className={styles.line} />
    </div>
  )
}
