import React from 'react'
import classnames from 'classnames'
import { Header } from '@components/header'
import { FeedbackComponent } from '@components/feedback'
import styles from '@style'
import { motion, AnimatePresence } from 'framer-motion'
import { useTitle } from 'hooks/use-title'
import { Footer } from '@components/footer'

import { IconCache } from '@utils/with-icon'
import { containerVariants } from '@utils/motion'

export const Page = ({ title = '', children = null, feed, className, top }) => {
  const classes = classnames({
    [styles.container]: true,
    [styles.feed]: feed,
  })
  // const [footerVisible, setFooterVisible] = useState(false)
  // const { y } = useWindowScroll()

  // useEffect(() => {
  //   setFooterVisible(y > 50)
  // }, [y])

  useTitle(title)

  return (
    <IconCache.Provider value={{}}>
      <FeedbackComponent />
      <Header />
      <motion.main
        initial="hidden"
        animate="visible"
        exit="exit"
        variants={containerVariants}
        className={`${classes} ${className ? className : ''}`}
      >
        <motion.div className={styles.content}>{children}</motion.div>
      </motion.main>
      <AnimatePresence>{/*footerVisible &&*/ <Footer menu />}</AnimatePresence>
    </IconCache.Provider>
  )
}
