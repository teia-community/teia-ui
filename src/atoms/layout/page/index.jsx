import React from 'react'
import classnames from 'classnames'
import { Header } from '@components/header'
import { FeedbackComponent } from '@components/feedback'
import { VisuallyHidden } from '@atoms/visually-hidden'
import styles from '@style'
import { motion, AnimatePresence } from 'framer-motion'
import { useTitle } from 'hooks/use-title'
import { Footer } from '@components/footer'
import { LocalSettingsProvider } from '@context'
import { IconCache } from '@utils/with-icon'

export const Page = ({ title = '', children = null }) => {
  const classes = classnames({
    [styles.container]: true,
  })
  // const [footerVisible, setFooterVisible] = useState(false)
  // const { y } = useWindowScroll()

  // useEffect(() => {
  //   setFooterVisible(y > 50)
  // }, [y])

  useTitle(title)
  // motion
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 1.5 } },
    exit: { opacity: 0, transition: { ease: 'easeInOut' } },
  }
  return (
    <LocalSettingsProvider>
      <IconCache.Provider value={{}}>
        <FeedbackComponent />
        <motion.main
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={containerVariants}
          className={classes}
        >
          <Header />

          <VisuallyHidden as="h1">
            {title !== '' ? `${title} - teia` : 'teia'}
          </VisuallyHidden>
          <div className={styles.content}>{children}</div>
          <AnimatePresence>
            {/*footerVisible &&*/ <Footer menu />}
          </AnimatePresence>
        </motion.main>
      </IconCache.Provider>
    </LocalSettingsProvider>
  )
}
