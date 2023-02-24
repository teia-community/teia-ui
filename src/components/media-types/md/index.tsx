import React from 'react'
import Markdown from 'markdown-to-jsx'
import { Container } from '@atoms/layout'
import { Button } from '@atoms/button'
import styles from '@style'

import axios from 'axios'

/**
 * @param {import("@types").MediaTypeProps} renderOptions - Th options for the media renderer
 */
export const MD = ({
  displayView,
  displayUri,
  artifactUri,
  previewUri,
  preview,
  objktID,
}) => {
  const [content, setContent] = React.useState('')

  React.useEffect(() => {
    if (artifactUri) {
      // const artifactHash = artifactUri.split('/ipfs/')[1]
      axios
        .get(artifactUri)
        // .get(`https://cloudflare-ipfs.com/ipfs/${artifactHash}`)
        .then((res) => {
          setContent(res.data)
        })
    }

    if (preview && previewUri) {
      if (previewUri.startsWith('data:text/markdown;base64,')) {
        const base64_md = previewUri.replace('data:text/markdown;base64,', '')
        setContent(atob(base64_md))
      } else {
        console.error('previewUri is not a base64 encoded markdown', previewUri)
      }
    }
  }, [artifactUri, previewUri, displayView, displayUri, preview])

  return displayView ? (
    <div className={styles.container}>
      <div className={styles.preview}>
        <img src={displayUri} alt={`cover for markdown object ${objktID}`} />
        <div className={styles.button}>
          <Button alt="View Markdown Token" />
        </div>
      </div>
    </div>
  ) : (
    <div>
      <Container>
        <Markdown>{content}</Markdown>
      </Container>
    </div>
  )
}

export default MD
