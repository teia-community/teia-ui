import classnames from 'classnames'
import { FeedbackComponent } from '@components/feedback'
import styles from '@style'
import { motion, AnimatePresence } from 'framer-motion'
import { usePageMeta } from '@hooks/use-title'
import { Footer } from '@components/footer'

import { containerVariants } from '@utils/motion'

interface PageProps {
  title?: string
  /** Shown in search results and link previews for this page. */
  description?: string
  /** Keep this page out of search results (errors, editors, admin). */
  noindex?: boolean
  children?: JSX.Element | JSX.Element[]
  feed?: boolean
  className?: string
  // top?: JSX.Element | JSX.Element[]
}

export const Page = ({
  title,
  description,
  noindex,
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

  usePageMeta({ title, description, noindex })

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
          {children}
        </motion.div>
      </motion.main>
      <AnimatePresence>{/*footerVisible &&*/ <Footer menu />}</AnimatePresence>
    </>
  )
}
