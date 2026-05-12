import { motion, AnimatePresence } from 'framer-motion'
import { shallow } from 'zustand/shallow'
import { Loading } from '@atoms/loading'
import { Button } from '@atoms/button'
import { fadeIn } from '@utils/motion'
import styles from '@style'
import { Markdown } from '@components/markdown'
import { useModalStore } from '@context/modalStore'

export const FeedbackComponent = () => {
  const [
    visible,
    message,
    progress,
    confirm,
    confirmCallback,
    cancelCallback,
    footerSlot,
  ] = useModalStore(
    (st) => [
      st.visible,
      st.message,
      st.progress,
      st.confirm,
      st.confirmCallback,
      st.cancelCallback,
      st.footerSlot,
    ],
    shallow
  )

  const isPrompt = Boolean(cancelCallback)

  return (
    <AnimatePresence>
      {visible && (
        <motion.div className={styles.container} {...fadeIn()}>
          <div className={styles.content}>
            <Markdown className={styles.message}>{message}</Markdown>
            {footerSlot}
            <div className={styles.loader}>{progress && <Loading />}</div>
            {confirm && (
              <div
                className={styles.buttons}
                style={{ marginTop: '1rem', gap: '0.5rem' }}
              >
                {isPrompt && (
                  <Button onClick={() => cancelCallback()}>cancel</Button>
                )}
                <Button shadow_box onClick={() => confirmCallback()}>
                  {isPrompt ? 'confirm' : 'close'}
                </Button>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
