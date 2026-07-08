import React from 'react'
import { Markdown } from '@components/markdown'
import { Container } from '@atoms/layout'
import styles from '@style'

import axios from 'axios'

// Strip markdown syntax for plain-text feed previews to avoid MarkdownToJSX
// recursion issues when many items are rendered simultaneously.
const stripMarkdown = (text) => {
  return text
    .replace(/!\[.*?\]\(.*?\)/g, '') // images
    .replace(/\[([^\]]+)\]\(.*?\)/g, '$1') // links → label
    .replace(/#{1,6}\s+/gm, '') // headings
    .replace(/[*_]{1,3}([^*_]+)[*_]{1,3}/g, '$1') // bold/italic
    .replace(/`{1,3}[^`]*`{1,3}/g, '') // inline code / fenced
    .replace(/^>\s+/gm, '') // blockquotes
    .replace(/^[-*+]\s+/gm, '') // list items
    .replace(/\n{2,}/g, ' ') // collapse blank lines
    .trim()
}

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
    <div
      className={styles.container}
      role="article"
      aria-label="Article content"
    >
      <Markdown>{content}</Markdown>
    </div>
  ) : (
    <div className={styles.feed}>
      <Container>
        <p className={styles.preview}>{stripMarkdown(content).slice(0, 600)}</p>
      </Container>
    </div>
  )
}

export default MD
