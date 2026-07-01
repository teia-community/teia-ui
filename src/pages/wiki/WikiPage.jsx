import { useMemo } from 'react'
import { useOutletContext, useParams, Link, Navigate } from 'react-router-dom'
import { Button } from '@atoms/button'
import { PATH } from '@constants'
import { walletPreview } from '@utils/string'
import { useUserProfiles } from '@data/roles'
import {
  useWikiPageContent,
  setPageHidden,
  showGetTeiaModal,
  resolvePageId,
  wikiSeg,
} from '@data/wiki'
import { WikiMarkdown } from '@components/wiki'
import styles from '@style'

/** Walk the parent chain (via IPFS meta, by page id) to build breadcrumbs. */
function useBreadcrumbs(pageId, meta) {
  return useMemo(() => {
    const crumbs = []
    let current = pageId
    const seen = new Set()
    while (current != null && meta[current] && !seen.has(current)) {
      seen.add(current)
      crumbs.unshift({
        id: current,
        title: meta[current].title || `Page ${current}`,
      })
      current = meta[current].parent
    }
    return crumbs
  }, [pageId, meta])
}

export default function WikiPage() {
  const { id } = useParams()
  const { wiki, canModerate, canPropose, refresh } = useOutletContext()

  // The URL param may be the pretty slug, a numeric id, or a stale slug from a
  // renamed page; all resolve to the page id and canonicalise to the current
  // title slug below, so old `/wiki/3` and `/wiki/old-slug` links keep working.
  const pageId = resolvePageId(wiki, id)
  const slug = pageId !== undefined ? wiki?.meta[pageId]?.slug : undefined

  const page =
    pageId !== undefined ? wiki?.pages.find((p) => p.id === pageId) : undefined
  const { data: content, error } = useWikiPageContent(page?.cid)
  const crumbs = useBreadcrumbs(pageId, wiki?.meta || {})
  const { data: profiles = {} } = useUserProfiles(
    page ? [page.editor, page.proposer].filter(Boolean) : []
  )

  if (!page || (page.hidden && !canModerate)) {
    return <Navigate to={PATH.WIKI} replace />
  }
  // Normalise numeric ids and stale slugs to the page's current title slug.
  if (slug && id !== slug) {
    return <Navigate to={`${PATH.WIKI}/${slug}`} replace />
  }

  const title = wiki.meta[pageId]?.title || `Page ${pageId}`

  const onToggleHidden = async () => {
    await setPageHidden({ pageId, hidden: !page.hidden })
    refresh()
  }

  return (
    <article className={styles.article}>
      {crumbs.length > 1 && (
        <nav className={styles.breadcrumbs} aria-label="Breadcrumb">
          {crumbs.map((c, i) => (
            <span key={c.id}>
              {i > 0 && <span className={styles.crumb_sep}>/</span>}
              {i === crumbs.length - 1 ? (
                <span>{c.title}</span>
              ) : (
                <Link to={`${PATH.WIKI}/${wikiSeg(wiki.meta, c.id)}`}>
                  {c.title}
                </Link>
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
          {canModerate || canPropose ? (
            <Button
              small
              shadow_box
              to={`${PATH.WIKI}/${wikiSeg(wiki.meta, pageId)}/edit`}
            >
              {canModerate ? 'Edit' : 'Propose Edit'}
            </Button>
          ) : (
            <Button small shadow_box onClick={showGetTeiaModal}>
              Propose Edit
            </Button>
          )}
          <Button
            small
            secondary
            shadow_box
            to={`${PATH.WIKI}/${wikiSeg(wiki.meta, pageId)}/history`}
          >
            History
          </Button>
          {canModerate && (
            <Button small secondary shadow_box onClick={onToggleHidden}>
              {page.hidden ? 'Unhide' : 'Hide'}
            </Button>
          )}
        </div>
      </div>

      <p className={styles.page_meta}>
        v{page.versionCount} · last edited by{' '}
        <Link to={`/tz/${page.editor}`}>
          {profiles[page.editor]?.alias || walletPreview(page.editor)}
        </Link>
        {page.proposer && (
          <>
            {' · proposed by '}
            <Link to={`/tz/${page.proposer}`}>
              {profiles[page.proposer]?.alias || walletPreview(page.proposer)}
            </Link>
          </>
        )}{' '}
        · {new Date(page.updatedAt).toLocaleDateString()}
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
