import { default as MarkdownToJSX } from 'markdown-to-jsx'
import styles from '@style'
import type { WithChildren } from '@types'

const LinkRenderer = (props: WithChildren<{ href: string }>) => {
  return (
    <a href={props.href} target="_blank" rel="noreferrer">
      {props.children}
    </a>
  )
}

export const Markdown = ({
  children,
  className = '',
}: {
  children: string
  className?: string
}) => {
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
        },
      }}
      className={`${className ? className : ''} ${styles.content}`}
    >
      {children}
    </MarkdownToJSX>
  )
}
