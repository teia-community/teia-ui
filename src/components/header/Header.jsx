/* eslint-disable react-hooks/exhaustive-deps */
import React, { useContext, useEffect, useState } from 'react'
import { walletPreview } from '@utils/string'

import { useLocation, useNavigate } from 'react-router'

import { AnimatePresence } from 'framer-motion'
import { TeiaContext } from '@context/TeiaContext'
import { Button, Primary } from '@atoms/button'
import { VisuallyHidden } from '@atoms'
import styles from '@style'
import { DropdownButton } from '@atoms/dropdown'
import { Menu } from '../icons'
import { ReactComponent as EventIcon } from './icons/events.svg'
import { MainMenu } from './main_menu/MainMenu'
import { EventBanner } from '@components/banners'
// import { RotatingLogo } from '@atoms/logo/RotatingLogo'

// TODO (mel): Remove this sample data and decide how/where to fetch it.
import { sample_events } from './sample_events'
import { EventMenu } from './events/EventMenu'
import { useMedia } from 'react-use'

export const Header = () => {
  const context = useContext(TeiaContext)
  const navigate = useNavigate()
  const location = useLocation()
  const isWide = useMedia('(min-width: 600px)')

  const [logoSeed, setLogoSeed] = useState(3)

  useEffect(() => {
    context.setAccount()
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
            <DropdownButton
              className={styles.events_button}
              icon={<EventIcon />}
              menuID="events"
              label={isWide ? 'Events' : ''}
            >
              <EventMenu events={sample_events} />
            </DropdownButton>
          </div>

          <Button
            onClick={() => {
              if (location.pathname === '/') {
                setLogoSeed(Math.random() * logoSeed)
              } else {
                handleRoute('/')
              }
            }}
          >
            <p className={styles.logo}>TEIA</p>
            {/* <RotatingLogo seed={logoSeed} className={styles.logo} /> */}
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
                {isWide && button}
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
        <span className="line-horizontal" />
      </header>
    </>
  )
}
