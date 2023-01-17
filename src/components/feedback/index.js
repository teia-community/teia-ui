import { useContext } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { TeiaContext } from '../../context/TeiaContext'
import { Loading } from '@atoms/loading'
import { Button } from '@atoms/button'
import { fadeIn } from '../../utils/motion'
import styles from '@style'
import Markdown from 'markdown-to-jsx'

export const FeedbackComponent = () => {
  const context = useContext(TeiaContext)
  const { visible, message, progress, confirm, confirmCallback } =
    context.feedback

  return (
    <AnimatePresence>
      {visible && (
        <motion.div className={styles.container} {...fadeIn()}>
          <div className={styles.content}>
            {progress && <Loading />}
            <Markdown className={styles.message}>{message}</Markdown>
            {confirm && (
              <div className={styles.buttons}>
                <Button shadow_box onClick={() => confirmCallback()}>
                  close
                </Button>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
