import React from 'react'
import Markdown from 'markdown-to-jsx'
import { Button } from '@atoms/button'
import styles from '@style'

import axios from 'axios'
import type { MediaTypeProps } from '@types'

/**
 * @param {import("@types").MediaTypeProps} renderOptions - Th options for the media renderer
 */
export const MD = ({
  displayView,
  displayUri,
  artifactUri,
  previewUri,
  nft,
}: MediaTypeProps) => {
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

    if (previewUri) {
      if (previewUri.startsWith('data:text/markdown;base64,')) {
        const base64_md = previewUri.replace('data:text/markdown;base64,', '')
        setContent(atob(base64_md))
      } else {
        console.error('previewUri is not a base64 encoded markdown', previewUri)
      }
    }
  }, [artifactUri, previewUri, displayView, displayUri])

  return displayView ? (
    <div className={styles.container}>
      <div className={styles.preview}>
        <img
          src={displayUri}
          alt={`cover for markdown object ${nft.token_id}`}
        />
        <div className={styles.button}>
          <Button alt="View Markdown Token" />
        </div>
      </div>
    </div>
  ) : (
    <div>
      <Markdown>{content}</Markdown>
    </div>
  )
}

export default MD
