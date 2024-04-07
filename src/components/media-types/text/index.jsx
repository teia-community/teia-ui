import React, { useRef } from 'react'
import styles from '@style'

import axios from 'axios'
/**
 * @param {import("@types").MediaTypeProps} renderOptions - Th options for the media renderer
 */

export const TXT = ({
  artifactUri,
  displayUri,
  displayView,
  previewUri,
  nft,
}) => {
  const [content, setContent] = React.useState('')
  const [isMonoType, setIsMonoType] = React.useState(false)
  const htmlRef = useRef()

  React.useEffect(() => {
    const getTextContent = async () => {
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
      axios.get(artifactUri).then((res) => {
        setContent(res.data)
      })
    } else if (displayUri) {
      getTextContent()
      setIsMonoType(nft.is_mono_type)
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
          <img src={previewUri} />
        ) : (
          <pre
            style={{
              fontFamily: isMonoType
                ? 'IBM Plex Mono, monospace'
                : 'Source Sans Pro, sans-serif',
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
