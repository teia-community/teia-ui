/* eslint-disable react-hooks/exhaustive-deps */
import React, { useContext, useEffect, useState } from 'react'
import { walletPreview } from '@utils/string'

import { useNavigate } from 'react-router'

import { AnimatePresence } from 'framer-motion'
import { TeiaContext } from '@context/TeiaContext'
import { Button, Primary } from '@atoms/button'
import { VisuallyHidden } from '@atoms/visually-hidden'
import styles from '@style'
import { getItem, setItem } from '@utils/storage'
import { HeaderButton } from './HeaderButton'
import { Menu } from '../icons'
import { ReactComponent as EventIcon } from './icons/events.svg'
import loadable from '@loadable/component'

// TODO (mel): Remove this sample data and decide how/where to fetch it.
import { sample_events } from './sample_events'
import { EventMenu } from './events/EventMenu'

const EventBanner = loadable(() => import('@components/banners/EventBanner'))
const MainMenu = loadable(() => import('./main_menu/MainMenu'))
const FilterBar = loadable(() => import('./filters/FilterBar'))
const EventCard = loadable(() => import('./events/EventCard'))
const RotatingLogo = loadable(() => import('@atoms/logo/RotatingLogo'))
const DropDown = loadable(() => import('@atoms/dropdown/Dropdown'))

export const Header = ({ filters = false }) => {
  const context = useContext(TeiaContext)
  const navigate = useNavigate()

  useEffect(() => {
    context.setAccount()
    context.setTheme(getItem('theme') || setItem('theme', 'dark'))
  }, [])

  const [button, setButton] = useState('Sync')
  const [accountPreview, setAccountPreview] = useState('')

  useEffect(() => {
    if (context.acc?.address) {
      // is menu closed?
      if (context.collapsed) {
        const proxyAddress = context.proxyAddress
          ? ` (${context.proxyName || walletPreview(context.proxyAddress)})`
          : ''
        setButton(walletPreview(context.acc.address) + proxyAddress)
        setAccountPreview(
          button
            .slice(button.length - 5, button.length)
            .split('')
            .join(' ')
        )
      } else {
        setButton('Unsync')
      }
    } else {
      setButton('Sync')
    }
  }, [context.acc?.address, context.collapsed])

  const handleRoute = (path, data) => {
    context.collapseMenu(true)
    navigate(path, { state: data })
  }

  const handleSyncUnsync = () => {
    if (context.acc?.address && !context.collapsed) {
      // disconnect wallet
      context.disconnect()
    } else {
      // connect wallet
      context.syncTaquito()
    }
  }

  return (
    <>
      <EventBanner />
      <AnimatePresence>{!context.collapsed && <MainMenu />}</AnimatePresence>
      <header className={`${styles.container}`}>
        <div className={styles.content}>
          <div className={styles.left}>
            <HeaderButton
              className={styles.events_button}
              icon={<EventIcon />}
              menuID="events"
              label="Events"
            >
              <EventMenu events={sample_events} />
            </HeaderButton>
          </div>

          <Button onClick={() => handleRoute('/')}>
            <RotatingLogo seed={10} className={styles.logo} />
          </Button>
          <div className={styles.right}>
            {!context.collapsed && context.proxyAddress && (
              <div className={styles.mr}>
                <Button onClick={() => context.setProxyAddress(null)} secondary>
                  <Primary>Exit collab</Primary>
                </Button>
              </div>
            )}

            <Button onClick={handleSyncUnsync} secondary>
              <Primary label={`wallet account ending in ${accountPreview}`}>
                {button}
              </Primary>
            </Button>
            <Button onClick={context.toggleMenu} secondary>
              <VisuallyHidden>
                {`${context.collapsed ? 'show' : 'hide'} menu`}
              </VisuallyHidden>
              <Menu isOpen={!context.collapsed} />
            </Button>
          </div>
        </div>

        {filters && <FilterBar />}
      </header>
    </>
  )
}
