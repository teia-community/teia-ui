import { Markdown } from '@components/markdown'
import { BANNER_URL } from '@constants'
import styles from '@style'
import { useEffect, useState } from 'react'
import JSON5 from 'json5'
import { TopBanner } from './TopBanner'

export const EventBanner = () => {
  const [content, setContent] = useState()
  const [config, setConfig] = useState()
  useEffect(() => {
    async function getBanner() {
      const config_response = await fetch(`${BANNER_URL}/banner_config.json`)
      const config_text = await config_response.text()
      const config_parsed = JSON5.parse(config_text)
      //* to debug it
      // config_parsed.enable = true
      setConfig(config_parsed)

      if (config_parsed.enable <= 0) {
        return
      }
      const md_response = await fetch(`${BANNER_URL}/banner.md`)
      const md_text = await md_response.text()
      setContent(md_text)
    }
    try {
      getBanner()
    } catch (e) {
      console.error(e)
    }
  }, [])
  return (
    <>
      {content && (
        <TopBanner color={config?.color}>
          <Markdown className={styles.content}>{content}</Markdown>
        </TopBanner>
      )}
    </>
  )
}

export default EventBanner
