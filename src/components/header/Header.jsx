/* eslint-disable react-hooks/exhaustive-deps */
import React, { useContext, useEffect, useState } from 'react'
import { walletPreview } from '@utils/string'

import { useLocation, useNavigate } from 'react-router'

import { AnimatePresence } from 'framer-motion'
import { TeiaContext } from '@context/TeiaContext'
import { Button } from '@atoms/button'
import styles from '@style'
import { DropDown, DropdownButton } from '@atoms/dropdown'
import { Menu } from '../icons'
import { EventIcon } from '@icons'
import { MainMenu } from './main_menu/MainMenu'
import { EventBanner } from '@components/banners'
// import { RotatingLogo } from '@atoms/logo/RotatingLogo'

// TODO (mel): Remove this sample data and decide how/where to fetch it.
import { sample_events } from './sample_events'
import { useMedia } from 'react-use'
import EventCard from './events/EventCard'
import { Line } from '@atoms/line'

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

  // on Menu Toggle or Sign in
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
    if (context.acc?.address) {
      if (context.collapsed) {
        handleRoute('/sync', '/tz')
      } else {
        // disconnect wallet
        context.disconnect()
      }
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
        <div
          className={`${styles.content} ${
            context.collapsed ? '' : styles.fill_bg
          }`}
        >
          <div className={styles.left}>
            <DropdownButton
              className={styles.events_button}
              icon={<EventIcon />}
              menuID="events"
              label={isWide ? 'Events' : ''}
            >
              {/* <EventMenu events={sample_events} /> */}
              <DropDown menuID="events" vertical>
                {sample_events?.map((evt) => {
                  return (
                    <EventCard
                      event={evt}
                      key={`${evt.title} - ${evt.subtitle}`}
                    />
                  )
                })}
              </DropDown>
            </DropdownButton>
          </div>

          <Button
            alt="main teia logo"
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
            {!context.collapsed && (
              <Button
                onClick={() => {
                  handleRoute('/settings')
                }}
                className={styles.config_button}
              >
                config
              </Button>
            )}
            {!context.collapsed && context.proxyAddress && (
              <div className={styles.mr}>
                <Button onClick={() => context.setProxyAddress(null)} secondary>
                  Exit collab
                </Button>
              </div>
            )}

            <Button
              onClick={handleSyncUnsync}
              secondary
              alt={`wallet account ending in ${accountPreview}`}
            >
              {isWide && button}
            </Button>
            <Button
              alt={`${context.collapsed ? 'show' : 'hide'} menu`}
              onClick={context.toggleMenu}
              secondary
            >
              <Menu isOpen={!context.collapsed} />
            </Button>
          </div>
        </div>
        <Line />
      </header>
    </>
  )
}
