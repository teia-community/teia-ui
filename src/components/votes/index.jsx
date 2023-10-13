import { useState } from 'react'
import styles from '@style'

export function Votes({
  votes,
  labels = { yes: 'yes', no: 'no', abstain: 'abs', empty: '--' },
  className,
}) {
  const [showValues, setShowValues] = useState(false)
  const { yes, no, abstain } = votes
  const totalVotes = Number(yes) + Number(no) + Number(abstain)

  const handleClick = (e) => {
    e.preventDefault()
    setShowValues(!showValues)
  }

  return (
    <button
      onClick={handleClick}
      className={`${styles.votes} ${className ?? ''}`}
    >
      {yes > 0 && (
        <span
          className={styles.yes_vote}
          style={{ width: `${(100 * yes) / totalVotes}%` }}
        >
          {showValues ? Math.round(yes) : labels.yes}
        </span>
      )}
      {no > 0 && (
        <span
          className={styles.no_vote}
          style={{ width: `${(100 * no) / totalVotes}%` }}
        >
          {showValues ? Math.round(no) : labels.no}
        </span>
      )}
      {abstain > 0 && (
        <span
          className={styles.abstain_vote}
          style={{ width: `${(100 * abstain) / totalVotes}%` }}
        >
          {showValues ? Math.round(abstain) : labels.abstain}
        </span>
      )}
      {totalVotes === 0 && (
        <span className={styles.empty_vote} style={{ width: '100%' }}>
          {showValues ? 0 : labels.empty}
        </span>
      )}
    </button>
  )
}
