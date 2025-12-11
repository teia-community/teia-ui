/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useRef, useState } from 'react'
import screenfull from 'screenfull'
import { useInView } from 'react-intersection-observer'
import classnames from 'classnames'
import { iOS } from '@utils/os'
import styles from '@style'
import './style.css'
import { FullScreenEnterIcon, FullScreenExitIcon, EnterAnav } from '@icons'
import { NFT } from '@types'
import { Button } from '@atoms/button'
import { HEN_CONTRACT_FA2, MIMETYPE } from '@constants'
import { useUserStore } from '@context/userStore'

/**
 * Currently fullscreen is disabled on iOS
 * this is mainly because Safari iOS doesn't support fullscreen api.
 */

/**
 * This component handles
 * - fullscreen mode
 * - inView prop for lazy loading
 * - the Anaverse viewer
 *
 **/

/**
 * Builds the anaverse URL
 */
const getAnaverseUrl = (tokenId: string, viewer_address?: string) => {
  return viewer_address
    ? `https://anaver.se/?gallery=1&loadsingle=1&singlecontract=${HEN_CONTRACT_FA2}&singletokenid=${tokenId}&wallet=${viewer_address}&partnerPlatform=teia.art`
    : `https://anaver.se/?gallery=1&loadsingle=1&singlecontract=${HEN_CONTRACT_FA2}&singletokenid=${tokenId}&partnerPlatform=teia.art`
}

/**
 * iFrame wrapper of Anaverse
 */
const AnaverseViewer = (tokenId: string, address?: string) => {
  const url = getAnaverseUrl(tokenId, address)
  return (
    <iframe
      className={styles.anaverse_view}
      title={`#${tokenId} inside Anaverse`}
      id="anavIframe"
      src={url}
    />
  )
}

export const Container = ({
  nft,
  children,
  displayView,
}: {
  nft: NFT
  children: React.ReactNode
  displayView?: boolean
}) => {
  const domElement = useRef<HTMLDivElement>(null)
  const [fullscreen, setFullscreen] = useState<boolean>()
  const [inAnaverse, setInAnaverse] = useState<boolean>()

  const { ref, inView } = useInView({
    threshold: 0,
    initialInView: false,
  })

  const nofullscreen = [
    MIMETYPE.MP4,
    MIMETYPE.OGV,
    MIMETYPE.QUICKTIME,
    MIMETYPE.WEBM,
  ].includes(nft.mime_type)

  const toggleFullScreen = () => {
    if (!domElement.current) return
    if (screenfull.isFullscreen) {
      screenfull.exit()
    } else {
      screenfull.request(domElement.current, { navigationUI: 'hide' })
    }
  }

  useEffect(() => {
    const fullscreenChange = (e: Event) => {
      if (iOS) {
        return
      }

      if (screenfull.isFullscreen) {
        setFullscreen(true)
      } else {
        setFullscreen(false)
      }
      // simulates resize to fix GLB player
      window.dispatchEvent(new Event('resize'))
    }
    if (nofullscreen || !iOS) {
      document.addEventListener('fullscreenchange', fullscreenChange)
      document.addEventListener(
        'webkitfullscreenchange',
        fullscreenChange,
        false
      )
    }

    return () => {
      if (nofullscreen || !iOS) {
        document.removeEventListener('fullscreenchange', fullscreenChange)
        document.removeEventListener(
          'webkitfullscreenchange',
          fullscreenChange,
          false
        )
      }
    }
  }, [])

  const classes = classnames({
    [styles.container]: true,
    [styles.fullscreen]: fullscreen,
    [styles.flex]: displayView,
    [styles.feed]: !displayView,
  })
  const viewer_address = useUserStore((st) => st.address)
  const anaverseView = AnaverseViewer(nft.token_id, viewer_address)
  const childrenWithProps = React.Children.map(children, (child) => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child, { inView, displayView } as any)
    }
    return child
  })

  const toggleAnaverse = () => {
    const isChromium = !!window.chrome
    if (isChromium) {
      setInAnaverse(!inAnaverse)
    } else {
      window.open(getAnaverseUrl(nft.token_id, viewer_address), '_blank')
    }
  }

  return (
    <div ref={ref}>
      <div ref={domElement} className={classes}>
        {inAnaverse ? anaverseView : childrenWithProps}

        <div style={{ display: 'flex' }}>
          {displayView && !iOS && !nofullscreen && (
            <Button
              alt={'Fullscreen Button'}
              className={
                styles.icon +
                ' svg-icon ' +
                (fullscreen ? styles.icon_fullscreen : '')
              }
              onClick={toggleFullScreen}
            >
              {fullscreen ? (
                <FullScreenEnterIcon width={32} />
              ) : (
                <FullScreenExitIcon width={32} />
              )}
            </Button>
          )}

          {displayView && !iOS && (
            <Button
              // TODO: Add a proper "tooltip" for buttons
              title={'Show in Anaverse'}
              alt={'Anaverse Button'}
              className={styles.icon + ' svg-icon '}
              onClick={toggleAnaverse}
            >
              {<EnterAnav width={32} />}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
