import { useOutletContext } from 'react-router-dom'
import WikiProposalList from './WikiProposalList'
import styles from '@style'

export default function WikiProposals() {
  const { wiki, canModerate, refresh } = useOutletContext()

  return (
    <article className={styles.article}>
      <h2>Community proposals</h2>
      <WikiProposalList
        proposals={wiki?.proposals || []}
        meta={wiki?.meta || {}}
        canModerate={canModerate}
        refresh={refresh}
      />
    </article>
  )
}
