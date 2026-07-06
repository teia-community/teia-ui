import { default as MarkdownToJSX } from 'markdown-to-jsx'
import { Link } from 'react-router-dom'
import styles from '@style'

const AUDIO_EXTENSIONS = /\.(mp3|wav|ogg|flac|aac|m4a|opus|webm)(\?|$)/i

/**
 * Internal wiki links (`/wiki/...`)
 */
const WikiLink = ({ href = '', children }) => {
  const isInternal = href.startsWith('/') && !href.startsWith('//')
  if (isInternal) {
    return <Link to={href}>{children}</Link>
  }
  return (
    <a href={href} target="_blank" rel="noreferrer">
      {children}
    </a>
  )
}

const ImgRenderer = ({ alt, src, ...props }) => {
  if (alt === 'Audio' || AUDIO_EXTENSIONS.test(src)) {
    return (
      <audio
        controls
        src={src}
        style={{ width: '100%', display: 'block', minHeight: '54px' }}
      />
    )
  }
  return <img alt={alt} src={src} {...props} />
}

/**
 * Markdown renderer for wiki pages. Same base as the shared <Markdown>, but
 * keeps internal links inside the SPA so the wiki feels like a wiki.
 */
export const WikiMarkdown = ({ children, className }) => {
  return (
    <MarkdownToJSX
      options={{
        forceBlock: true,
        disableParsingRawHTML: true,
        overrides: {
          a: { component: WikiLink },
          img: { component: ImgRenderer },
        },
      }}
      className={`${className || ''} ${styles.markdown}`}
    >
      {children || ''}
    </MarkdownToJSX>
  )
}

export default WikiMarkdown
