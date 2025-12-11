/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from 'react'
import { walletPreview } from '@utils/string'

import { useLocation, useNavigate } from 'react-router'

import { AnimatePresence } from 'framer-motion'
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
import { useLocalSettings } from '@context/localSettingsStore'
import { useUserStore } from '@context/userStore'
import { useModalStore } from '@context/modalStore'
import { shallow } from 'zustand/shallow'

export const Header = () => {
  const [
    address,
    setAccount,
    proxyName,
    proxyAddress,
    userInfo,
    unsync,
    sync,
    resetProxy,
  ] = useUserStore(
    (st) => [
      st.address,
      st.setAccount,
      st.proxyName,
      st.proxyAddress,
      st.userInfo,
      st.unsync,
      st.sync,
      st.resetProxy,
    ],
    shallow
  )
  const [collapsed, setCollapsed, toggleMenu] = useModalStore(
    (st) => [st.collapsed, st.setCollapsed, st.toggleMenu],
    shallow
  )

  // Subscribe to theme changes using zustand
  useEffect(() => {
    const applyTheme = useLocalSettings.getState().applyTheme
    const unsub = useLocalSettings.subscribe((st) => st.theme, applyTheme, {
      fireImmediately: true,
    })
    return unsub
  }, [])

  useEffect(() => {
    const item = document.body.parentElement
    if (item) {
      item.style.overflowY = collapsed ? '' : 'scroll'
      item.style.position = collapsed ? '' : 'fixed'
    }
  }, [collapsed])

  const navigate = useNavigate()
  const location = useLocation()

  const isWide = useMedia('(min-width: 600px)')

  const [logoSeed, setLogoSeed] = useState(1)
  /** the header is a bit larger just on home */
  const [onHome, setOnHome] = useState(false)

  const [syncLabel, setSyncLabel] = useState('Sync')
  const [walletLabel, setWalletLabel] = useState('')

  const [accountPreview, setAccountPreview] = useState('')

  useEffect(() => {
    setAccount()
    setLogoSeed(Math.floor(Math.random() * 150))
  }, [])

  useEffect(() => {
    setOnHome(location.pathname === '/')
  }, [location.pathname])

  // on Menu Toggle or Sign in
  useEffect(() => {
    const updateTitle = ([address, proxyAddress, proxyName, userInfo]) => {
      setSyncLabel(address ? 'Unsync' : 'Sync')
      if (address) {
        // is menu closed?
        if (collapsed) {
          const proxy = proxyAddress
            ? ` (${proxyName || walletPreview(proxyAddress)})`
            : ''
          const userName = userInfo?.name ? `(${userInfo.name})` : ''
          setWalletLabel(() => walletPreview(address) + (proxy || userName))
          setAccountPreview(() =>
            syncLabel
              .slice(syncLabel.length - 5, syncLabel.length)
              .split('')
              .join(' ')
          )
        }
      }
    }

    return useUserStore.subscribe(
      (st) => [st.address, st.proxyAddress, st.proxyName, st.userInfo],
      updateTitle
    )
  }, [])

  const handleRoute = (path, data = null) => {
    setCollapsed(true)
    if (data) {
      navigate(path, { state: data })
    } else {
      navigate(path)
    }
  }

  const handleSyncUnsync = () => {
    if (address) {
      if (collapsed) {
        const name = proxyName || userInfo?.name
        const current_address = proxyAddress || address

        if (name) {
          handleRoute(`/${name}`)
        } else {
          handleRoute(`${PATH.ISSUER}/${current_address}`)
        }
      } else {
        // disconnect wallet
        unsync()
      }
    } else {
      // connect wallet
      sync()
    }
  }

  const container_classes = classNames({
    [styles.grid]: true,
    // [styles.large]: onHome,
    [styles.fill_bg]: !collapsed,
  })

  return (
    <>
      <EventBanner />
      <AnimatePresence>{!collapsed && <MainMenu />}</AnimatePresence>
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
            to={onHome ? '/' : undefined}
            onTo={() => {
              setCollapsed(true)
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
            {!collapsed && (
              <>
                <Button
                  alt={'local settings'}
                  to="/settings"
                  onTo={() => setCollapsed(true)}
                  className={styles.config_button}
                >
                  <ConfigIcon fill="var(--text-color)" width={16} height={16} />
                  {isWide && 'Config'}
                </Button>
                {/* <Line className={styles.separator} vertical /> */}
              </>
            )}
            {!collapsed && proxyAddress && (
              <>
                <Line className={styles.separator} vertical />
                <Button
                  alt={'exit collab'}
                  small
                  onClick={() => resetProxy()}
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
                !collapsed
                  ? accountPreview
                    ? 'unsync'
                    : 'sync'
                  : accountPreview
                    ? `wallet account ending in ${accountPreview}`
                    : 'sync wallet'
              }
            >
              {/* {isWide && syncLabel} */}
              {!collapsed || !address ? (
                <span key="synclabel">{syncLabel}</span>
              ) : (
                <span key="">{walletLabel}</span>
              )}
            </Button>
            <Button
              alt={`${collapsed ? 'show' : 'hide'} menu`}
              onClick={toggleMenu}
              secondary
            >
              <Menu isOpen={!collapsed} />
            </Button>
          </div>
        </div>
        <Line />
      </header>
    </>
  )
}
