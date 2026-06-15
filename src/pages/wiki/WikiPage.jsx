import { useMemo } from 'react'
import { useOutletContext, useParams, Link, Navigate } from 'react-router-dom'
import { Button } from '@atoms/button'
import { PATH } from '@constants'
import { walletPreview } from '@utils/string'
import { useWikiPageContent, setPageHidden } from '@data/wiki'
import { WikiMarkdown } from '@components/wiki'
import styles from '@style'

/** Walk the parent chain (via IPFS meta) to build breadcrumbs. */
function useBreadcrumbs(slug, meta) {
  return useMemo(() => {
    const crumbs = []
    let current = slug
    const seen = new Set()
    while (current && meta[current] && !seen.has(current)) {
      seen.add(current)
      crumbs.unshift({ slug: current, title: meta[current].title || current })
      current = meta[current].parent
    }
    return crumbs
  }, [slug, meta])
}

export default function WikiPage() {
  const { slug } = useParams()
  const { wiki, canModerate, canPropose, refresh } = useOutletContext()
  const page = wiki?.pages.find((p) => p.slug === slug)
  const { data: content, error } = useWikiPageContent(page?.cid)
  const crumbs = useBreadcrumbs(slug, wiki?.meta || {})

  if (!page || (page.hidden && !canModerate)) {
    return <Navigate to={PATH.WIKI} replace />
  }

  const title = wiki.meta[slug]?.title || slug

  const onToggleHidden = async () => {
    await setPageHidden({ slug, hidden: !page.hidden })
    refresh()
  }

  return (
    <article className={styles.article}>
      {crumbs.length > 1 && (
        <nav className={styles.breadcrumbs} aria-label="Breadcrumb">
          {crumbs.map((c, i) => (
            <span key={c.slug}>
              {i > 0 && <span className={styles.crumb_sep}>/</span>}
              {i === crumbs.length - 1 ? (
                <span>{c.title}</span>
              ) : (
                <Link to={`${PATH.WIKI}/${c.slug}`}>{c.title}</Link>
              )}
            </span>
          ))}
        </nav>
      )}

      <div className={styles.page_head}>
        <h1 className={styles.page_title}>
          {title}
          {page.hidden && <span className={styles.hidden_tag}> (hidden)</span>}
        </h1>
        <div className={styles.page_actions}>
          {(canModerate || canPropose) && (
            <Button small to={`${PATH.WIKI}/${slug}/edit`}>
              {canModerate ? 'Edit' : 'Propose edit'}
            </Button>
          )}
          <Button small secondary to={`${PATH.WIKI}/${slug}/history`}>
            History
          </Button>
          {canModerate && (
            <Button small secondary onClick={onToggleHidden}>
              {page.hidden ? 'Unhide' : 'Hide'}
            </Button>
          )}
        </div>
      </div>

      <p className={styles.page_meta}>
        v{page.versionCount} · last edited by {walletPreview(page.editor)} ·{' '}
        {new Date(page.updatedAt).toLocaleDateString()}
      </p>

      {!content && !error ? (
        <p className={styles.notice}>Loading content…</p>
      ) : content ? (
        <WikiMarkdown>{content.content}</WikiMarkdown>
      ) : (
        <p className={styles.notice}>
          Could not load this page&apos;s content from IPFS.
        </p>
      )}
    </article>
  )
}
