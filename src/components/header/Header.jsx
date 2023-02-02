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
import RotatingLogo from '@atoms/logo'

// TODO (mel): Remove this sample data and decide how/where to fetch it.
import { sample_events } from './sample_events'
import { useMedia } from 'react-use'
import EventCard from './events/EventCard'
import { Line } from '@atoms/line'
import { ConfigIcon } from '@icons'

export const Header = () => {
  const context = useContext(TeiaContext)
  const navigate = useNavigate()
  const location = useLocation()
  const isWide = useMedia('(min-width: 600px)')

  const [logoSeed, setLogoSeed] = useState(3)
  /** the header is a bit larger just on home */
  const [onHome, setOnHome] = useState()

  useEffect(() => {
    context.setAccount()
    setOnHome(location.pathname === '/')
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
          className={`${styles.grid} ${onHome ? styles.large : null} ${
            !context.collapsed ? styles.fill_bg : null
          }`}
        >
          <div className={styles.left}>
            <DropdownButton
              alt={'events dropdown'}
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
            alt="teia logo"
            to={!onHome ? '/' : null}
            onTo={() => {
              setOnHome(onHome)
            }}
            onClick={() => {
              setLogoSeed(Math.random() * 100)
            }}
          >
            {/* <p className={styles.logo}>TEIA</p> */}
            <RotatingLogo seed={logoSeed} className={styles.logo} />
          </Button>
          <div className={styles.right}>
            {!context.collapsed && (
              <>
                <Button
                  alt={'local settings'}
                  to="/settings"
                  onTo={() => context.collapseMenu(true)}
                  className={styles.config_button}
                >
                  <ConfigIcon width={16} height={16} />
                  Config
                </Button>
                {/* <Line className={styles.separator} vertical /> */}
              </>
            )}
            {!context.collapsed && context.proxyAddress && (
              <>
                <Button
                  alt={'exit collab'}
                  small
                  onClick={() => context.setProxyAddress(null)}
                  secondary
                >
                  Exit collab
                </Button>
                <Line className={styles.separator} vertical />
              </>
            )}

            <Button
              onClick={handleSyncUnsync}
              secondary
              alt={
                !context.collapsed
                  ? accountPreview
                    ? 'unsync'
                    : 'sync'
                  : accountPreview
                  ? `wallet account ending in ${accountPreview}`
                  : 'sync wallet'
              }
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
