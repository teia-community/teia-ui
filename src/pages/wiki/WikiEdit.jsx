import { useOutletContext, useParams, Navigate } from 'react-router-dom'
import { PATH } from '@constants'
import { useWikiPageContent } from '@data/wiki'
import WikiEditor from './WikiEditor'
import styles from '@style'

/** Loads the current page document, then hands it to the shared editor. */
export default function WikiEdit() {
  const { slug } = useParams()
  const { wiki, canModerate, canPropose } = useOutletContext()
  const page = wiki?.pages.find((p) => p.slug === slug)
  const { data: content, error } = useWikiPageContent(page?.cid)

  if (!page) return <Navigate to={PATH.WIKI} replace />
  if (!canModerate && !canPropose) {
    return (
      <p className={styles.notice}>
        Connect a wallet that holds TEIA tokens to propose edits.
      </p>
    )
  }
  if (!content && !error) return <p className={styles.notice}>Loading…</p>

  return (
    <WikiEditor
      mode="edit"
      slug={slug}
      initial={{
        title: content?.title || wiki.meta[slug]?.title || slug,
        parent: content?.parent || wiki.meta[slug]?.parent || '',
        content: content?.content || '',
      }}
    />
  )
}
