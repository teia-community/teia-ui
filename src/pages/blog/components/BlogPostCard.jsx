import { Link } from 'react-router-dom'
import { PATH } from '@constants'
import styles from './BlogPostCard.module.scss'

// Format date to readable string
function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

// Extract excerpt from text content
function getExcerpt(text, maxLength = 200) {
  if (!text) return ''
  const cleaned = text.replace(/\n+/g, ' ').trim()
  if (cleaned.length <= maxLength) return cleaned
  return cleaned.slice(0, maxLength).trim() + '...'
}

export function BlogPostCard({ nft }) {
  const {
    token_id,
    name,
    description,
    minted_at,
    artist_profile,
    artist_address,
  } = nft
  const authorName = artist_profile?.name || artist_address?.slice(0, 8) + '...'

  return (
    <article className={styles.card}>
      <Link to={`${PATH.OBJKT}/${token_id}`} className={styles.link}>
        <h2 className={styles.title}>{name || `Untitled #${token_id}`}</h2>
        <p className={styles.excerpt}>{getExcerpt(description)}</p>
        <div className={styles.meta}>
          <span className={styles.author}>{authorName}</span>
          <span className={styles.date}>{formatDate(minted_at)}</span>
        </div>
      </Link>
    </article>
  )
}
