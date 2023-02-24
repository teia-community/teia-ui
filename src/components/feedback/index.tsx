import { motion, AnimatePresence } from 'framer-motion'
import { Loading } from '@atoms/loading'
import { Button } from '@atoms/button'
import { fadeIn } from '@utils/motion'
import styles from '@style'
import { Markdown } from '@components/markdown'
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
            <Markdown className={styles.message}>{message}</Markdown>
            <div className={styles.loader}>{progress && <Loading />}</div>
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
