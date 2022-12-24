/* eslint-disable react-hooks/exhaustive-deps */
import React, { useContext, useEffect, useRef } from 'react'
import screenfull from 'screenfull'
import { useInView } from 'react-intersection-observer'
import classnames from 'classnames'
import { iOS } from '../../utils/os'
import { HicetnuncContext } from '../../context/HicetnuncContext'
import styles from '@style'
import './style.css'
import { FullScreenEnter, FullScreenExit } from '@icons'

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
 * @param {boolean} containerOptions.interactive - In "detailed" view?
 * @param {flex} containerOptions.flex - Use a flex container
 *
 **/
export const Container = ({
  children = null,
  interactive,
  nofullscreen = false,
  nft,
  flex = false,
}) => {
  const context = useContext(HicetnuncContext)
  const domElement = useRef()

  const { ref, inView } = useInView({
    threshold: 0,
  })

  const toggleFullScreen = () => {
    if (!screenfull.isFullscreen) {
      screenfull.request(domElement.current, { navigationUI: 'hide' })
    } else {
      screenfull.exit()
    }
  }

  useEffect(() => {
    const fullscreenChange = (e) => {
      if (iOS) {
        return
      }

      if (screenfull.isFullscreen) {
        context.setFullscreen(true)
      } else {
        context.setFullscreen(false)
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
    [styles.fullscreen]: context.fullscreen,
    [styles.flex]: interactive,
  })

  const childrenWithProps = React.Children.map(children, (child) => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child, { inView, interactive })
    }
    return child
  })

  return (
    <div ref={ref}>
      <div ref={domElement} className={classes}>
        {childrenWithProps}

        {interactive && !iOS && !nofullscreen && (
          <div
            onClick={toggleFullScreen}
            className={
              styles.icon +
              ' svg-icon ' +
              (context.fullscreen ? styles.icon_fullscreen : '')
            }
            onKeyPress={toggleFullScreen}
            tabIndex="0"
            role="button"
            aria-label="fullscreen"
          >
            {context.fullscreen ? <FullScreenEnter /> : <FullScreenExit />}
          </div>
        )}
      </div>
    </div>
  )
}
