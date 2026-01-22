import { DiscourseEmbed } from '@components/discourse'
import styles from '@style'

const DISCOURSE_CATEGORY_URL = 'https://discourse.teia.art/c/teia-dao/12'

export default function Discourse() {
  return (
    <section className={styles.section}>
      <h1 className={styles.section_title}>Discourse Discussions</h1>
      <p>
        Community discussions about Teia polls and governance from the{' '}
        <a href={DISCOURSE_CATEGORY_URL} target="_blank" rel="noreferrer">
          Teia DAO forum
        </a>
        .
      </p>

      <div style={{ marginTop: '2em' }}>
        <DiscourseEmbed topicUrl={DISCOURSE_CATEGORY_URL} />
      </div>
    </section>
  )
}
