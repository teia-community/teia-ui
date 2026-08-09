import { Link } from 'react-router-dom'
import { PATH } from '@constants'
import {
  useCurationContent,
  useCurationToken,
  pickerThumb,
} from '@data/curations'
import { msgIpfsToUrl } from '@data/messaging/ipfs'
import styles from '@style'

export default function CurationCard({ curation }) {
  const { data: content } = useCurationContent(curation.cid)

  const title = content?.title || `Curation ${curation.id}`
  const tokenCount = content?.tokens?.length ?? 0
  const cover = content?.cover_image

  const firstRef =
    !cover && content?.tokens?.length ? content.tokens[0] : undefined
  const { data: firstToken } = useCurationToken(firstRef)
  const fallbackThumb = firstToken ? pickerThumb(firstToken) : ''

  const coverUrl = cover ? msgIpfsToUrl(cover) : fallbackThumb

  return (
    <Link className={styles.card} to={`${PATH.CURATIONS}/${curation.id}`}>
      {coverUrl ? (
        <img className={styles.cover} src={coverUrl} alt={title} />
      ) : (
        <div className={styles.cover}>
          {content ? `${tokenCount} token${tokenCount === 1 ? '' : 's'}` : '…'}
        </div>
      )}
      <div className={styles.card_body}>
        <h3 className={styles.card_title}>
          {title}
          {curation.hidden && (
            <span className={styles.hidden_badge}>hidden</span>
          )}
        </h3>
        <div className={styles.card_meta}>
          {tokenCount} token{tokenCount === 1 ? '' : 's'}
        </div>
      </div>
    </Link>
  )
}
