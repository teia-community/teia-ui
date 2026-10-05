import { Link } from 'react-router-dom'
import { HashToURL } from '@utils'
import { BURN_ADDRESS } from '@constants'
import { getTimeAgo } from '@utils/time'
import { formatTez, marketplaceForType } from '@utils/activity'
import { UserLink } from '@components/user-link'
import { useLocalSettings } from '@context/localSettingsStore'
import { ActivityBadge } from './ActivityBadge'
import styles from './index.module.scss'

const IMGPROXY = import.meta.env.VITE_IMGPROXY

/**
 * Small preview for the row: the imgproxy thumbnail (`teia_meta.preview_uri`)
 * when the viewer has imgproxy on, else the CDN copy of the display image.
 */
function thumbnailOf(token, useImgproxy) {
  const preview = token.teia_meta?.preview_uri
  if (useImgproxy && IMGPROXY && preview) return `${IMGPROXY}${preview}`
  return HashToURL(token.display_uri || token.thumbnail_uri, 'CDN')
}

/** Resolve the participant ({ address, name }) for an event attribute. */
function participant(event, attr) {
  if (!attr) return null
  if (attr === 'burn') return { address: BURN_ADDRESS, name: 'Burn Address' }
  return {
    address: event[`${attr}_address`],
    name: event[`${attr}_profile`]?.name,
  }
}

export function ActivityRow({ event, meta }) {
  const token = event.token || {}
  const imgproxy = useLocalSettings((st) => st.imgproxy)
  const thumb = thumbnailOf(token, imgproxy)
  const from = participant(event, meta.fromAttr)
  // Listings target a marketplace (derived from the event type), not a wallet.
  const market =
    meta.toAttr === 'market' ? marketplaceForType(event.type) : null
  const to = market ? null : participant(event, meta.toAttr)
  const price = meta.showPrice ? formatTez(event.price) : null

  const itemInner = (
    <>
      {thumb ? (
        <img src={thumb} alt="" loading="lazy" className={styles.thumb} />
      ) : (
        <span className={styles.thumb} />
      )}
      <span className={styles.name}>
        {token.name || (token.token_id ? `#${token.token_id}` : 'Unknown item')}
      </span>
    </>
  )

  return (
    <div className={styles.row}>
      <div className={styles.event}>
        <ActivityBadge color={meta.color} label={meta.label} />
      </div>

      {token.token_id ? (
        <Link
          to={`/objkt/${token.token_id}`}
          className={styles.item}
          title={token.name}
        >
          {itemInner}
        </Link>
      ) : (
        <div className={styles.item}>{itemInner}</div>
      )}

      <div className={styles.from}>{from ? <UserLink {...from} /> : null}</div>
      <div className={styles.to}>
        {market ? (
          <a
            href={`https://tzkt.io/${market.address}`}
            target="_blank"
            rel="noreferrer"
          >
            {market.name}
          </a>
        ) : to ? (
          <UserLink {...to} />
        ) : null}
      </div>

      <div className={`${styles.num} ${styles.amount}`}>
        {meta.editions != null ? `x${meta.editions}` : null}
      </div>

      <div className={`${styles.num} ${styles.price}`}>
        {price != null ? `${price} ꜩ` : '—'}
      </div>

      <div className={`${styles.num} ${styles.time}`} title={event.timestamp}>
        <a
          href={`https://tzkt.io/${event.ophash}`}
          target="_blank"
          rel="noreferrer"
        >
          {getTimeAgo(event.timestamp)}
        </a>
      </div>
    </div>
  )
}

export default ActivityRow
