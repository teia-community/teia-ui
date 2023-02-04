/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useRef, useState } from 'react'
import screenfull from 'screenfull'
import { useInView } from 'react-intersection-observer'
import classnames from 'classnames'
import { iOS } from '@utils/os'
import styles from '@style'
import './style.css'
import { FullScreenEnterIcon, FullScreenExitIcon } from '@icons'

/**
 * Currently fullscreen is disabled on iOS
 * this is mainly because Safari iOS doesn't support fullscreen api.
 */

/**
 * This component handles fullscreen mode
 * and inView prop for lazy loading
 */

/**
 * This component handles fullscreen mode
 * and inView prop for lazy loading
 * @param {Object} containerOptions
 * @param {import("@types").NFT} containerOptions.nft
 * @param {React.ReactNode} containerOptions.children
 * @param {boolean} containerOptions.nofullscreen
 * @param {boolean} containerOptions.displayView - On OBJKT display
 *
 **/
export const Container = ({
  nft,
  children = null,
  displayView,
  nofullscreen = false,
  //flex = false,
}) => {
  const domElement = useRef()
  const [fullscreen, setFullscreen] = useState()

  const { ref, inView } = useInView({
    threshold: 0,
  })

  const toggleFullScreen = () => {
    if (screenfull.isFullscreen) {
      screenfull.exit()
    } else {
      screenfull.request(domElement.current, { navigationUI: 'hide' })
    }
  }

  useEffect(() => {
    const fullscreenChange = (e) => {
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
  })

  const childrenWithProps = React.Children.map(children, (child) => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child, { inView, displayView })
    }
    return child
  })

  return (
    <div ref={ref}>
      <div ref={domElement} className={classes}>
        {childrenWithProps}

        {displayView && !iOS && !nofullscreen && (
          <div
            onClick={toggleFullScreen}
            className={
              styles.icon +
              ' svg-icon ' +
              (fullscreen ? styles.icon_fullscreen : '')
            }
            onKeyPress={toggleFullScreen}
            tabIndex="0"
            role="button"
            aria-label="fullscreen"
          >
            {fullscreen ? <FullScreenEnterIcon /> : <FullScreenExitIcon />}
          </div>
        )}
      </div>
    </div>
  )
}
