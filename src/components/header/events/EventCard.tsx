import Button from '@atoms/button/Button'
import { Markdown } from '@components/markdown'
import styles from '@style'
import type { FeedEvent } from '@types'
import { motion } from 'framer-motion'

export const EventCard = ({ event }: { event: FeedEvent }) => {
  const itemVariants = {
    hidden: {
      opacity: 0,
      x: -100,
      transition: {
        ease: 'easeOut',
      },
    },
    show: {
      opacity: 1,
      x: 0,
      transition: {
        ease: 'easeOut',
      },
    },
  }

  return (
    <article className={styles.event_card}>
      <motion.h1 variants={itemVariants}>
        {event.feed ? (
          <Button to={`/feed/${event.feed}`}>
            {event.title}{' '}
            {event.icon && (
              <span className={styles.event_icon}>{event.icon}</span>
            )}
          </Button>
        ) : (
          <>
            {event.title}
            {event.icon && (
              <span className={styles.event_icon}>{event.icon}</span>
            )}
          </>
        )}
      </motion.h1>
      <motion.p variants={itemVariants} className={styles.event_tag_line}>
        {event.subtitle}
      </motion.p>
      <motion.div variants={itemVariants} className={styles.event_content}>
        <Markdown>{event.content}</Markdown>
        {event.link && (
          <a target="_blank" rel="noreferrer" href={event.link}>
            {'More info >> '}
          </a>
        )}
      </motion.div>
    </article>
  )
}

export default EventCard
