import { useMemo } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { Page } from '@atoms/layout'
import { Button } from '@atoms/button'
import { useUserStore } from '@context/userStore'
import { PATH } from '@constants'
import { useWiki, useWikiRoles, buildTree } from '@data/wiki'
import { WikiSidebar } from '@components/wiki'
import styles from '@style'

/**
 * Wiki shell: loads the full page/proposal state once and shares it with the
 * nested routes via the router outlet context. Hidden pages are only surfaced
 * to moderators.
 */
export default function WikiLayout() {
  const address = useUserStore((st) => st.address)
  const navigate = useNavigate()

  const { data, error, mutate } = useWiki()
  const isLoading = !data && !error
  const { data: roles } = useWikiRoles(address)
  const canModerate = Boolean(roles?.canModerate)
  const canPropose = Boolean(roles?.canPropose)

  const { tree, hiddenSlugs } = useMemo(() => {
    if (!data) return { tree: [], hiddenSlugs: new Set() }
    const visible = canModerate
      ? data.pages
      : data.pages.filter((p) => !p.hidden)
    return {
      tree: buildTree(visible, data.meta),
      hiddenSlugs: new Set(
        data.pages.filter((p) => p.hidden).map((p) => p.slug)
      ),
    }
  }, [data, canModerate])

  const outletContext = {
    wiki: data,
    roles,
    canModerate,
    canPropose,
    address,
    refresh: mutate,
  }

  return (
    <Page title="Teia Wiki">
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.headline}>Teia Wiki</h1>
          <div className={styles.header_actions}>
            {(canModerate || canPropose) && (
              <Button small to={`${PATH.WIKI}/create`}>
                {canModerate ? 'New Page' : 'Propose Page'}
              </Button>
            )}
            {canModerate && (
              <Button small to={`${PATH.WIKI}/proposals`}>
                Proposals
              </Button>
            )}
          </div>
        </div>

        {error ? (
          <p className={styles.notice}>
            Could not load the wiki. Please try again later.
          </p>
        ) : isLoading ? (
          <p className={styles.notice}>Loading wiki…</p>
        ) : (
          <div className={styles.layout}>
            <aside className={styles.sidebar_col}>
              <Button
                small
                secondary
                onClick={() => navigate(PATH.WIKI)}
                className={styles.home_link}
              >
                Home
              </Button>
              <WikiSidebar tree={tree} hiddenSlugs={hiddenSlugs} />
            </aside>
            <section className={styles.content_col}>
              <Outlet context={outletContext} />
            </section>
          </div>
        )}
      </div>
    </Page>
  )
}
