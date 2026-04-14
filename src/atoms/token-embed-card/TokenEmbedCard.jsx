import { Link } from 'react-router-dom'
import { HashToURL } from '@utils'
import { walletPreview } from '@utils/string'
import styles from './index.module.scss'

function getPreviewUri(embed) {
  const mime = embed.mimeType || ''
  if (mime.startsWith('image/')) {
    return embed.artifactUri || embed.displayUri || embed.thumbnailUri
  }
  if (mime.startsWith('video/')) {
    return embed.displayUri || embed.thumbnailUri
  }
  return embed.displayUri || embed.thumbnailUri || embed.artifactUri
}

export default function TokenEmbedCard({ embed, onRemove }) {
  if (!embed || embed.type !== 'token') return null

  const mime = embed.mimeType || ''
  const previewUri = getPreviewUri(embed)
  const href = `/objkt/${embed.tokenId}`

  let media
  if (mime.startsWith('video/') && embed.artifactUri) {
    media = (
      <video
        src={HashToURL(embed.artifactUri)}
        className={styles.media}
        muted
        loop
        autoPlay
        playsInline
      />
    )
  } else if (mime === 'image/gif' && embed.artifactUri) {
    media = (
      <img src={HashToURL(embed.artifactUri)} alt="" className={styles.media} />
    )
  } else if (previewUri) {
    media = (
      <img
        src={HashToURL(previewUri, 'CDN', { size: 'small' })}
        alt=""
        className={styles.media}
      />
    )
  } else {
    media = <div className={styles.placeholder}>#</div>
  }

  return (
    <div className={styles.card}>
      <Link to={href} style={{ display: 'contents' }}>
        {media}
        <div className={styles.info}>
          <div className={styles.name}>{embed.name}</div>
          <div className={styles.sub}>
            #{embed.tokenId}
            {embed.artist
              ? ` · ${embed.artistName || walletPreview(embed.artist)}`
              : ''}
          </div>
        </div>
      </Link>
      {onRemove && (
        <button
          type="button"
          className={styles.remove}
          onClick={onRemove}
          title="Remove"
        >
          &times;
        </button>
      )}
    </div>
  )
}
