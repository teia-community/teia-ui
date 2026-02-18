import React from 'react'
import { Markdown } from '@components/markdown'
import { Container } from '@atoms/layout'
import styles from '@style'

import axios from 'axios'

/**
 * @param {import("@types").MediaTypeProps} renderOptions - Th options for the media renderer
 */
export const MD = ({ displayView, artifactUri, previewUri, preview }) => {
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
  }, [artifactUri, previewUri, preview])

  return displayView ? (
    <div className={styles.container}>
      <Markdown>{content}</Markdown>
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
