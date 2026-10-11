import styles from './index.module.scss'

/**
 * The channel description, shown as the first bubble in the room.
 *
 * A channel opened for the first time used to be an empty panel: the
 * description was a small line in the header, easy to miss, and a room with no
 * messages yet said nothing about itself. Putting it where the conversation
 * starts means the first thing read is what the room is for.
 *
 * It is not a message: it has no author, no timestamp and no actions.
 *
 * @param {object} props
 * @param {string} props.name channel name
 * @param {string} [props.description]
 * @param {string} [props.image] resolved image url
 */
export default function ChannelIntro({ name, description, image }) {
  if (!description) return null

  return (
    <div className={styles.bubbleRow}>
      {image && (
        <img src={image} alt="" className={styles.bubbleAvatar} width={32} />
      )}
      <div className={styles.bubbleContent}>
        <span className={styles.bubbleSender}>{name}</span>
        <div
          className={`${styles.bubble} ${styles.bubbleOther} ${styles.bubbleIntro}`}
        >
          {description}
        </div>
        <div className={styles.bubbleMeta}>
          <span>About this chat</span>
        </div>
      </div>
    </div>
  )
}
