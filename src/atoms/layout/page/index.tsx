import classnames from 'classnames'
import { FeedbackComponent } from '@components/feedback'
import styles from '@style'
import { motion, AnimatePresence } from 'framer-motion'
import { useTitle } from '@hooks/use-title'
import { Footer } from '@components/footer'

import { containerVariants } from '@utils/motion'

interface PageProps {
  title?: string
  children?: JSX.Element | JSX.Element[]
  feed?: boolean
  className?: string
  // top?: JSX.Element | JSX.Element[]
}

export const Page = ({
  title,
  children,
  feed,
  className /*, top*/,
}: PageProps) => {
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
    <>
      <FeedbackComponent />
      <motion.main
        initial="hidden"
        animate="visible"
        exit="exit"
        variants={containerVariants}
        className={`${classes} ${className ? className : ''}`}
      >
        <motion.div className={`${styles.content} no-fool`}>
          <>{children}</>
        </motion.div>
      </motion.main>
      <AnimatePresence>{/*footerVisible &&*/ <Footer menu />}</AnimatePresence>
    </>
  )
}
