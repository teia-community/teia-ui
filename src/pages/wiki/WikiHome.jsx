import { useOutletContext, Link } from 'react-router-dom'
import { PATH, WIKI_INDEX_SLUG } from '@constants'
import { useWikiPageContent } from '@data/wiki'
import { WikiMarkdown } from '@components/wiki'
import styles from '@style'

/**
 * Wiki landing page. Renders the curated [Index] page when it exists,
 * otherwise falls back to an auto-generated list of top-level pages.
 */
export default function WikiHome() {
  const { wiki } = useOutletContext()
  const indexPage = wiki?.pages.find((p) => p.slug === WIKI_INDEX_SLUG)
  const { data: content, error } = useWikiPageContent(indexPage?.cid)

  if (indexPage) {
    if (!content && !error) return <p className={styles.notice}>Loading…</p>
    return (
      <article className={styles.article}>
        <WikiMarkdown>{content?.content}</WikiMarkdown>
      </article>
    )
  }

  // Fallback: list top-level pages.
  const topLevel = (wiki?.pages || []).filter(
    (p) => !p.hidden && !wiki.meta[p.slug]?.parent
  )

  return (
    <article className={styles.article}>
      <h2>Welcome to the Teia Wiki</h2>
      {topLevel.length === 0 ? (
        <p>No pages have been published yet.</p>
      ) : (
        <ul>
          {topLevel.map((p) => (
            <li key={p.slug}>
              <Link to={`${PATH.WIKI}/${p.slug}`}>
                {wiki.meta[p.slug]?.title || p.slug}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </article>
  )
}
