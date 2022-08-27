import React, { useEffect, useState } from 'react'
import styles from './styles.module.scss'
import { BANNER_URL } from '@constants'
import Markdown from 'markdown-to-jsx'

export const EventBanner = React.forwardRef((props, ref) => {
  const [banner, setBanner] = useState(null)

  useEffect(() => {
    async function getBanner() {
      const response = await fetch(BANNER_URL)
      const text = await response.text()
      setBanner(text)
    }
    getBanner()
  }, [])
  return (
    <div ref={ref} className={styles.event__banner}>
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
})
