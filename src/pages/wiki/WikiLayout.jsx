import { useMemo, useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import classnames from 'classnames'
import { Page } from '@atoms/layout'
import { Button } from '@atoms/button'
import { useUserStore } from '@context/userStore'
import { PATH } from '@constants'
import {
  useWiki,
  useWikiRoles,
  useWikiPageContent,
  buildTree,
  resolvePageId,
  showGetTeiaModal,
} from '@data/wiki'
import { summarize } from '@utils/page-meta.mjs'
import { WikiSidebar } from '@components/wiki'
import styles from '@style'

const WIKI_DESCRIPTION =
  "The Teia Wiki: community-written pages on Teia's history, governance, rules and events, and on art and community projects on Tezos."

// Wiki routes that are tools rather than reading pages.
const TOOL_ROUTES = ['create', 'admin', 'proposals']

/**
 * Wiki shell: loads the full page/proposal state once and shares it with the
 * nested routes via the router outlet context. Hidden pages are only surfaced
 * to moderators.
 */
export default function WikiLayout() {
  const address = useUserStore((st) => st.address)
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const hideSidebar = pathname === `${PATH.WIKI}/admin`

  const { data, error, mutate } = useWiki()
  const isLoading = !data && !error
  const { data: roles } = useWikiRoles(address)
  const paused = Boolean(data?.paused)
  const canModerate = Boolean(roles?.canModerate) && !paused
  const canPropose = Boolean(roles?.canPropose) && !paused

  const [sortBy, setSortBy] = useState('title')

  const { tree, hiddenIds } = useMemo(() => {
    if (!data) return { tree: [], hiddenIds: new Set() }
    const visible = canModerate
      ? data.pages
      : data.pages.filter((p) => !p.hidden)
    return {
      tree: buildTree(visible, data.meta, sortBy),
      hiddenIds: new Set(data.pages.filter((p) => p.hidden).map((p) => p.id)),
    }
  }, [data, canModerate, sortBy])

  // Title and description for the page being read. The layout owns the <Page>,
  // so it resolves them here rather than in the nested route.
  const [seg, sub] = pathname.slice(PATH.WIKI.length + 1).split('/')
  const isTool = TOOL_ROUTES.includes(seg) || Boolean(sub)
  const pageId = seg && !isTool ? resolvePageId(data, seg) : undefined
  const current =
    pageId !== undefined
      ? data?.pages.find((p) => p.id === pageId && !p.hidden)
      : undefined
  const { data: doc } = useWikiPageContent(current?.cid)
  const pageTitle = current ? data.meta[pageId]?.title : undefined
  const description = current
    ? summarize(doc?.content) || WIKI_DESCRIPTION
    : WIKI_DESCRIPTION

  const outletContext = {
    wiki: data,
    roles,
    canModerate,
    canPropose,
    paused,
    address,
    refresh: mutate,
  }

  return (
    <Page
      title={pageTitle ? `${pageTitle} - Teia Wiki` : 'Teia Wiki'}
      description={description}
      noindex={isTool}
    >
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.headline}>Teia Wiki</h1>
          <div className={styles.header_actions}>
            {canModerate || canPropose ? (
              <Button small shadow_box to={`${PATH.WIKI}/create`}>
                {canModerate ? 'New Page' : 'Propose Page'}
              </Button>
            ) : (
              <Button small shadow_box onClick={showGetTeiaModal}>
                Propose Page
              </Button>
            )}
            {canModerate && (
              <Button small shadow_box to={`${PATH.WIKI}/proposals`}>
                Proposals
              </Button>
            )}
            {canModerate && (
              <Button small shadow_box to={`${PATH.WIKI}/admin`}>
                Admin
              </Button>
            )}
          </div>
        </div>

        {paused && (
          <p className={styles.notice}>
            The wiki is temporarily paused by governance. Pages are read-only
            until it resumes.
          </p>
        )}

        {error ? (
          <p className={styles.notice}>
            Could not load the wiki. Please try again later.
          </p>
        ) : isLoading ? (
          <p className={styles.notice}>Loading wiki…</p>
        ) : (
          <div
            className={classnames(styles.layout, {
              [styles.layout_full]: hideSidebar,
            })}
          >
            {!hideSidebar && (
              <aside className={styles.sidebar_col}>
                <Button
                  small
                  secondary
                  onClick={() => navigate(PATH.WIKI)}
                  className={styles.home_link}
                >
                  Home
                </Button>
                <div className={styles.sidebar_sort}>
                  <label htmlFor="wiki-sort">Sort by</label>
                  <select
                    id="wiki-sort"
                    className={styles.select}
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    <option value="title">Alphabetical</option>
                    <option value="created">Date created</option>
                    <option value="updated">Date last edited</option>
                  </select>
                </div>
                <WikiSidebar tree={tree} hiddenIds={hiddenIds} />
              </aside>
            )}
            <section className={styles.content_col}>
              <Outlet context={outletContext} />
            </section>
          </div>
        )}
      </div>
    </Page>
  )
}
