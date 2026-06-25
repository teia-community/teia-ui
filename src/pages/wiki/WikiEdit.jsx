import { useOutletContext, useParams, Navigate } from 'react-router-dom'
import { PATH } from '@constants'
import { useWikiPageContent } from '@data/wiki'
import WikiEditor from './WikiEditor'
import styles from '@style'

/** Loads the current page document, then hands it to the shared editor. */
export default function WikiEdit() {
  const { id } = useParams()
  const { wiki, canModerate, canPropose } = useOutletContext()
  const pageId = /^\d+$/.test(id ?? '') ? Number(id) : undefined
  const page =
    pageId !== undefined ? wiki?.pages.find((p) => p.id === pageId) : undefined
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

  const meta = wiki.meta[pageId]
  return (
    <WikiEditor
      mode="edit"
      pageId={pageId}
      initial={{
        title: content?.title || meta?.title || `Page ${pageId}`,
        slug: content?.slug || meta?.slug || '',
        parent: content?.parent || '',
        content: content?.content || '',
      }}
    />
  )
}
