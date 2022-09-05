import React from 'react'
import styles from './styles.module.scss'
import Markdown from 'markdown-to-jsx'
import { motion, AnimatePresence } from 'framer-motion'

function LinkRenderer(props: any) {
  return (
    <a href={props.href} target="_blank" rel="noreferrer">
      {props.children}
    </a>
  )
}
export const EventBanner = ({ banner, bannerColor, visible }) => {
  return (
    <AnimatePresence>
      {banner && visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{ backgroundColor: bannerColor }}
          className={styles.event__banner}
        >
          <Markdown
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
            className={styles.content}
          >
            {banner}
          </Markdown>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
