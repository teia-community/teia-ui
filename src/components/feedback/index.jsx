import { motion, AnimatePresence } from 'framer-motion'
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
    footerSlot,
    asking,
    askResolve,
  ] = useModalStore((st) => [
    st.visible,
    st.message,
    st.progress,
    st.confirm,
    st.confirmCallback,
    st.footerSlot,
    st.asking,
    st.askResolve,
  ])

  const close = useModalStore((st) => st.close)

  const handleConfirm = () => {
    if (askResolve) askResolve(true)
    close()
  }

  const handleCancel = () => {
    if (askResolve) askResolve(false)
    close()
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div className={styles.container} {...fadeIn()}>
          <div className={styles.content}>
            <Markdown className={styles.message}>{message}</Markdown>
            {footerSlot}
            <div className={styles.loader}>{progress && <Loading />}</div>
            {asking && (
              <div className={styles.buttons} style={{ marginTop: '1rem' }}>
                <Button shadow_box onClick={handleConfirm}>
                  Confirm
                </Button>
                <Button shadow_box onClick={handleCancel}>
                  Cancel
                </Button>
              </div>
            )}
            {confirm && !asking && (
              <div className={styles.buttons} style={{ marginTop: '1rem' }}>
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
