import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PATH } from '@constants'
import { HashToURL } from '@utils'
import { useUserStore } from '@context/userStore'
import { useModalStore } from '@context/modalStore'
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

export function BlogPostCard({ nft, showBurn = false }) {
  const [showConfirm, setShowConfirm] = useState(false)
  const [isBurning, setIsBurning] = useState(false)
  const burn = useUserStore((st) => st.burn)

  const {
    token_id,
    name,
    description,
    display_uri,
    minted_at,
    artist_profile,
    artist_address,
    editions,
  } = nft
  const authorName = artist_profile?.name || artist_address?.slice(0, 8) + '...'
  const coverUrl = display_uri ? HashToURL(display_uri) : null

  const handleBurnClick = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setShowConfirm(true)
  }

  const handleConfirmBurn = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsBurning(true)

    try {
      await burn(token_id.toString(), editions || 1)
      useModalStore
        .getState()
        .show('Burned', `Post #${token_id} has been burned.`)
      setShowConfirm(false)
    } catch (error) {
      console.error('Burn error:', error)
      useModalStore
        .getState()
        .show('Burn Failed', error.message || 'Failed to burn post.')
    } finally {
      setIsBurning(false)
    }
  }

  const handleCancelBurn = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setShowConfirm(false)
  }

  return (
    <article className={styles.card}>
      <div className={styles.card_content}>
        <Link to={`${PATH.OBJKT}/${token_id}`} className={styles.link}>
          {coverUrl && (
            <div className={styles.cover}>
              <img
                src={coverUrl}
                alt={name || `Post #${token_id}`}
                loading="lazy"
              />
            </div>
          )}
          <div className={styles.text}>
            <h2 className={styles.title}>{name || `Untitled #${token_id}`}</h2>
            <p className={styles.excerpt}>{getExcerpt(description)}</p>
            <div className={styles.meta}>
              <span className={styles.author}>{authorName}</span>
              <span className={styles.date}>{formatDate(minted_at)}</span>
            </div>
          </div>
        </Link>

        {showBurn && !showConfirm && (
          <div className={styles.actions}>
            <button
              className={styles.burn_btn}
              onClick={handleBurnClick}
              title="Burn this post"
            >
              Burn
            </button>
          </div>
        )}

        {showBurn && showConfirm && (
          <div className={styles.confirm}>
            <span className={styles.confirm_text}>
              Burn this post permanently?
            </span>
            <div className={styles.confirm_actions}>
              <button
                className={styles.confirm_yes}
                onClick={handleConfirmBurn}
                disabled={isBurning}
              >
                {isBurning ? 'Burning...' : 'Yes, burn it'}
              </button>
              <button
                className={styles.confirm_no}
                onClick={handleCancelBurn}
                disabled={isBurning}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </article>
  )
}
