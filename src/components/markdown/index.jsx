import { default as MarkdownToJSX } from 'markdown-to-jsx'
import styles from '@style'

const AUDIO_EXTENSIONS = /\.(mp3|wav|ogg|flac|aac|m4a|opus|webm)(\?|$)/i

const LinkRenderer = (props) => {
  return (
    <a href={props.href} target="_blank" rel="noreferrer">
      {props.children}
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

export const Markdown = ({ children, className }) => {
  return (
    <MarkdownToJSX
      options={{
        forceBlock: true,
        overrides: {
          a: {
            component: LinkRenderer,
          },
          hr: {
            props: {
              className: styles.spacer,
            },
          },
          img: {
            component: ImgRenderer,
          },
        },
      }}
      className={`${className ? className : ''} ${styles.content}`}
    >
      {children}
    </MarkdownToJSX>
  )
}
