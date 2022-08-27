import React, { useEffect, useState } from 'react'
import styles from './styles.module.scss'
import { BANNER_URL } from '@constants'
import Markdown from 'markdown-to-jsx'
import JSON5 from 'json5'

export const EventBanner = React.forwardRef((props, ref) => {
  const [banner, setBanner] = useState(null)
  const [bannerColor, setBannerColor] = useState(null)

  useEffect(() => {
    async function getBanner() {
      const md_response = await fetch(`${BANNER_URL}/banner.md`)
      const md_text = await md_response.text()
      setBanner(md_text)

      const config_response = await fetch(`${BANNER_URL}/banner_config.json`)
      const config_text = await config_response.text()
      const config = JSON5.parse(config_text)
      setBannerColor(config.color)
    }
    try {
      getBanner()
    } catch (e) {
      console.error(e)
    }
  }, [])
  return (
    banner && (
      <div
        ref={ref}
        style={{ backgroundColor: bannerColor }}
        className={styles.event__banner}
      >
        <Markdown
          options={{
            forceBlock: true,
            overrides: {
              hr: {
                props: {
                  className: styles.spacer,
                },
              },
            },
          }}
          className={styles.content}
        >
          {banner || ''}
        </Markdown>
        {/* <h1>
          The TEIA community has moved to teia.art!{' '}
          <a
            className={styles.desktop__link}
            href="https://blog.teia.art/blog/teia-art-launch-announcement"
          >
            Learn more
          </a>
        </h1> */}
      </div>
    )
  )
})
