import { motion, AnimatePresence } from 'framer-motion'
import { Loading } from '@atoms/loading'
import { Button } from '@atoms/button'
import { fadeIn } from '@utils/motion'
import styles from '@style'
import Markdown from 'markdown-to-jsx'
import { useModalStore } from '@context/modalStore'

export const FeedbackComponent = () => {
  const [visible, message, progress, confirm, confirmCallback] = useModalStore(
    (st) => [
      st.visible,
      st.message,
      st.progress,
      st.confirm,
      st.confirmCallback,
    ]
  )

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
