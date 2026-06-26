import { useOutletContext, Link } from 'react-router-dom'
import { PATH, WIKI_INDEX_PAGE_ID } from '@constants'
import { useWikiPageContent } from '@data/wiki'
import { WikiMarkdown } from '@components/wiki'
import styles from '@style'

/**
 * Wiki landing page. Renders the curated index page (by page id) when one is
 * configured, otherwise falls back to an auto-generated list of top-level pages.
 */
export default function WikiHome() {
  const { wiki } = useOutletContext()
  const indexPage =
    WIKI_INDEX_PAGE_ID !== null
      ? wiki?.pages.find((p) => p.id === WIKI_INDEX_PAGE_ID)
      : undefined
  const { data: content, error } = useWikiPageContent(indexPage?.cid)

  if (indexPage && content) {
    return (
      <article className={styles.article}>
        <WikiMarkdown>{content.content}</WikiMarkdown>
      </article>
    )
  }
  if (indexPage && !error) {
    return <p className={styles.notice}>Loading…</p>
  }

  // Fallback: list top-level pages.
  const topLevel = (wiki?.pages || []).filter(
    (p) => !p.hidden && wiki.meta[p.id]?.parent == null
  )

  return (
    <article className={styles.article}>
      <h2>Welcome to the Teia Wiki</h2>
      {topLevel.length === 0 ? (
        <p>No pages have been published yet.</p>
      ) : (
        <ul>
          {topLevel.map((p) => (
            <li key={p.id}>
              <Link to={`${PATH.WIKI}/${p.id}`}>
                {wiki.meta[p.id]?.title || `Page ${p.id}`}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </article>
  )
}
