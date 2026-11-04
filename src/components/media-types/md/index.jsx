import React from 'react'
import axios from 'axios'
import { LazyLoadImage } from 'react-lazy-load-image-component'
import { Markdown } from '@components/markdown'
import { Container } from '@atoms/layout'
import { useLocalSettings } from '@context/localSettingsStore'
import styles from '@style'

const MD_DATA_URI = 'data:text/markdown;base64,'

// Plain-text fallback for tokens with no usable cover image. Rendering
// MarkdownToJSX for every item in a feed hits recursion limits once there are
// many of them, so the fallback deliberately shows text rather than markup.
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
export const MD = ({
  displayView,
  artifactUri,
  displayUri,
  previewUri,
  nft,
}) => {
  const [content, setContent] = React.useState('')
  const [coverFailed, setCoverFailed] = React.useState(false)
  const imgproxy = useLocalSettings((st) => st.imgproxy)

  // Markdown tokens carry a cover image like any other token, so a feed can
  // render that instead of fetching and parsing every artifact. Same source and
  // precedence as ImageComponent.
  const coverSrc = React.useMemo(() => {
    if (
      imgproxy &&
      import.meta.env.VITE_IMGPROXY &&
      nft?.teia_meta?.preview_uri
    ) {
      return `${import.meta.env.VITE_IMGPROXY}${nft.teia_meta.preview_uri}`
    }
    return displayUri
  }, [imgproxy, nft, displayUri])

  const showCover = !displayView && !!coverSrc && !coverFailed

  React.useEffect(() => {
    if (showCover) {
      return
    }

    // While minting there is no artifact on ipfs yet, just a local reader.
    if (previewUri?.startsWith(MD_DATA_URI)) {
      setContent(atob(previewUri.slice(MD_DATA_URI.length)))
      return
    }

    if (artifactUri) {
      axios
        .get(artifactUri)
        .then((res) => setContent(res.data))
        .catch((err) => console.error('could not load markdown', err))
    }
  }, [showCover, artifactUri, previewUri])

  if (displayView) {
    return (
      <div
        className={styles.container}
        role="article"
        aria-label="Article content"
      >
        <Markdown>{content}</Markdown>
      </div>
    )
  }

  if (showCover) {
    return (
      <div className={styles.cover}>
        <LazyLoadImage
          className={styles.image}
          src={coverSrc}
          width={600}
          alt={`object ${nft?.token_id} cover`}
          onError={() => setCoverFailed(true)}
        />
      </div>
    )
  }

  return (
    <div className={styles.feed}>
      <Container>
        <p className={styles.preview}>{stripMarkdown(content).slice(0, 600)}</p>
      </Container>
    </div>
  )
}

export default MD
