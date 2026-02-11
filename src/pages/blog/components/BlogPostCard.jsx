import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PATH, MARKETPLACE_CONTRACT_TEIA } from '@constants'
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
  const [burnAmount, setBurnAmount] = useState(1)
  const burn = useUserStore((st) => st.burn)
  const address = useUserStore((st) => st.address)

  const {
    token_id,
    name,
    description,
    display_uri,
    minted_at,
    artist_profile,
    artist_address,
    editions,
    listings,
    holdings,
  } = nft
  const authorName = artist_profile?.name || artist_address?.slice(0, 8) + '...'
  const coverUrl = display_uri ? HashToURL(display_uri) : null

  // Get editions hold
  const userHolding = holdings?.find((h) => h.holder_address === address)
  const userAmount = userHolding ? parseInt(userHolding.amount) : 0

  // Active Teia listings
  const teiaListings = listings?.filter(
    (l) =>
      l.status === 'active' &&
      l.contract_address === MARKETPLACE_CONTRACT_TEIA &&
      l.seller_address === address
  )
  const teiaListedAmount =
    teiaListings?.reduce((sum, l) => sum + (parseInt(l.amount_left) || 0), 0) ||
    0

  // Any active listings
  const allUserListings = listings?.filter(
    (l) => l.status === 'active' && l.seller_address === address
  )
  const totalListedAmount =
    allUserListings?.reduce(
      (sum, l) => sum + (parseInt(l.amount_left) || 0),
      0
    ) || 0

  const handleBurnClick = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setBurnAmount(userAmount)
    setShowConfirm(true)
  }

  const handleConfirmBurn = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsBurning(true)

    try {
      await burn(token_id.toString(), burnAmount)
      useModalStore
        .getState()
        .show(
          'Burned',
          `Burned ${burnAmount} edition${
            burnAmount !== 1 ? 's' : ''
          } of post #${token_id}.`
        )
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

        {showBurn && (
          <div className={styles.token_info}>
            <span>
              {editions} minted / {userAmount} in your wallet
            </span>
            {totalListedAmount > 0 && (
              <span className={styles.on_sale}>
                {totalListedAmount} on sale
              </span>
            )}
          </div>
        )}

        {showBurn && !showConfirm && userAmount > 0 && (
          <div className={styles.actions}>
            <button
              className={styles.burn_btn}
              onClick={handleBurnClick}
              title="Burn editions of this post"
            >
              Burn
            </button>
          </div>
        )}

        {showBurn && showConfirm && (
          <div className={styles.confirm}>
            {teiaListedAmount > 0 && (
              <div className={styles.warning}>
                Note: {teiaListedAmount} edition
                {teiaListedAmount !== 1 ? 's are' : ' is'} currently listed on
                Teia. Burning does not cancel active listings.
              </div>
            )}
            <label className={styles.burn_label}>
              Burn
              <input
                type="number"
                min={1}
                max={userAmount}
                value={burnAmount}
                onChange={(e) => {
                  const val = Math.max(
                    1,
                    Math.min(userAmount, parseInt(e.target.value) || 1)
                  )
                  setBurnAmount(val)
                }}
                className={styles.burn_input}
                disabled={isBurning}
              />
              <span className={styles.burn_max}>/ {userAmount}</span>
            </label>
            <div className={styles.confirm_actions}>
              <button
                className={styles.confirm_yes}
                onClick={handleConfirmBurn}
                disabled={isBurning}
              >
                {isBurning
                  ? 'Burning...'
                  : `Burn ${burnAmount} edition${burnAmount !== 1 ? 's' : ''}`}
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
