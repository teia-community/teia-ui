/* eslint-disable react-hooks/exhaustive-deps */
import { useContext, useEffect, useState } from 'react'
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
import classNames from 'classnames'
import { PATH } from '@constants'

export const Header = () => {
  const context = useContext(TeiaContext)
  const navigate = useNavigate()
  const location = useLocation()

  const isWide = useMedia('(min-width: 600px)')

  const [logoSeed, setLogoSeed] = useState(3)
  /** the header is a bit larger just on home */
  const [onHome, setOnHome] = useState()

  const [syncLabel, setSyncLabel] = useState('Sync')
  const [walletLabel, setWalletLabel] = useState('')

  const [accountPreview, setAccountPreview] = useState('')

  useEffect(() => {
    context.setAccount()
    setOnHome(location.pathname === '/')
  }, [])

  // on Menu Toggle or Sign in
  useEffect(() => {
    setSyncLabel(context.address ? 'Unsync' : 'Sync')

    if (context.address) {
      // is menu closed?
      if (context.collapsed) {
        const proxyAddress = context.proxyAddress
          ? ` (${context.proxyName || walletPreview(context.proxyAddress)})`
          : ''
        const userName = context.userInfo?.name
          ? `(${context.userInfo.name})`
          : ''
        setWalletLabel(
          () => walletPreview(context.address) + (proxyAddress || userName)
        )
        setAccountPreview(() =>
          syncLabel
            .slice(syncLabel.length - 5, syncLabel.length)
            .split('')
            .join(' ')
        )
      }
    }
  }, [context.address, context.collapsed])

  const handleRoute = (path, data) => {
    context.collapseMenu(true)
    navigate(path, { state: data })
  }

  const handleSyncUnsync = () => {
    if (context.address) {
      if (context.collapsed) {
        const name = context.proxyName || context.userInfo?.name
        const address = context.proxyAddress || context.address

        if (name) {
          handleRoute(`/${name}`)
        } else {
          handleRoute(`${PATH.ISSUER}/${address}`)
        }
      } else {
        // disconnect wallet
        context.disconnect()
      }
    } else {
      // connect wallet
      context.syncTaquito()
    }
  }

  const container_classes = classNames({
    [styles.grid]: true,
    // [styles.large]: onHome,
    [styles.fill_bg]: !context.collapsed,
  })

  return (
    <>
      <EventBanner />
      <AnimatePresence>{!context.collapsed && <MainMenu />}</AnimatePresence>
      <header className={`${styles.container}`}>
        <div className={container_classes}>
          <div className={styles.left}>
            <DropdownButton
              alt={'events dropdown'}
              className={styles.events_button}
              icon={<EventIcon />}
              menuID="events"
              label={isWide ? 'Events' : ''}
              id={`events-${location.pathname}`}
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
              context.collapseMenu(true)
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
                  <ConfigIcon fill="var(--text-color)" width={16} height={16} />
                  {isWide && 'Config'}
                </Button>
                {/* <Line className={styles.separator} vertical /> */}
              </>
            )}
            {!context.collapsed && context.proxyAddress && (
              <>
                <Line className={styles.separator} vertical />
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
              className={styles.sync_label}
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
              {/* {isWide && syncLabel} */}
              {!context.collapsed || !context.address ? (
                <span key="synclabel">{syncLabel}</span>
              ) : (
                <span key="">{walletLabel}</span>
              )}
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
