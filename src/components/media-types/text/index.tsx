import React, { useRef } from 'react'
import styles from '@style'


/**
 * @param {import("@types").MediaTypeProps} renderOptions - Th options for the media renderer
 */

import { MediaTypeProps } from '@types'

export const TXT = ({
  artifactUri,
  displayUri,
  displayView,
  previewUri,
  nft,
}: MediaTypeProps) => {
  const [content, setContent] = React.useState('')
  const [isMonoType, setIsMonoType] = React.useState(false)
  const htmlRef = useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const getTextContent = async () => {
      if (!displayUri) return
      await fetch(displayUri)
        .then((response) => {
          if (!response.ok) {
            throw new Error('Error reading blob')
          }
          return response.text()
        })
        .then((text) => {
          setContent(text)
        })
        .catch((error) => {
          console.error('Error fetching the file:', error)
        })
    }

    if (artifactUri) {
      fetch(artifactUri)
        .then((res) => res.text())
        .then((data) => {
          setContent(data)
        })
        .catch((err) => console.error(err))
    } else if (displayUri) {
      getTextContent()
      setIsMonoType(nft.is_mono_type || false)
    }

    if (nft?.tags && nft?.tags?.length > 0) {
      let transformedTags = nft.tags.map((tag) => tag.tag.toLowerCase())
      if (
        transformedTags.includes('monospace') ||
        transformedTags.includes('mono')
      ) {
        setIsMonoType(true)
      }
    }
  }, [artifactUri, previewUri, displayView, displayUri, nft])

  return (
    <div ref={htmlRef} className={styles.container}>
      <div className={styles.preview}>
        {!displayView && previewUri ? (
          <img
            alt={`Text NFT thumbnail for ${nft.token_id}`}
            src={previewUri}
          />
        ) : (
          <pre
            style={{
              fontFamily: isMonoType
                ? 'Iosevka, monospace'
                : 'Source Sans Pro, sans-serif',
              overflowY: 'auto',
            }}
          >
            {content}
          </pre>
        )}
      </div>
    </div>
  )
}

export default TXT
