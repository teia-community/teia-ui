import { useMemo, useState } from 'react'
import { useOutletContext, Navigate, Link } from 'react-router-dom'
import { Button } from '@atoms/button'
import { PATH } from '@constants'
import { walletPreview } from '@utils/string'
import { useUserProfiles } from '@data/messaging/token-comments'
import { setPageHidden } from '@data/wiki'
import WikiProposalList from './WikiProposalList'
import styles from '@style'

const SORTS = {
  title: (a, b) => a.title.localeCompare(b.title),
  version: (a, b) => a.page.versionCount - b.page.versionCount,
  updated: (a, b) => +new Date(a.page.updatedAt) - +new Date(b.page.updatedAt),
}

function SortHeader({ label, sortKey, sort, setSort }) {
  const active = sort.key === sortKey
  const arrow = active ? (sort.dir === 'asc' ? ' ▲' : ' ▼') : ''
  return (
    <th>
      <button
        type="button"
        className={styles.sort_header}
        onClick={() =>
          setSort((s) =>
            s.key === sortKey
              ? { key: sortKey, dir: s.dir === 'asc' ? 'desc' : 'asc' }
              : { key: sortKey, dir: 'asc' }
          )
        }
      >
        {label}
        {arrow}
      </button>
    </th>
  )
}

export default function WikiAdmin() {
  const { wiki, canModerate, refresh } = useOutletContext()
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState({ key: 'updated', dir: 'desc' })
  const [busySlug, setBusySlug] = useState(null)

  const pages = useMemo(() => wiki?.pages || [], [wiki?.pages])
  const proposals = useMemo(() => wiki?.proposals || [], [wiki?.proposals])
  const meta = useMemo(() => wiki?.meta || {}, [wiki?.meta])

  const editorAddrs = useMemo(
    () => [...new Set(pages.map((p) => p.editor).filter(Boolean))],
    [pages]
  )
  const { data: profiles = {} } = useUserProfiles(editorAddrs)

  const stats = useMemo(() => {
    const contributors = new Set()
    pages.forEach((p) => {
      if (p.editor) contributors.add(p.editor)
      if (p.proposer) contributors.add(p.proposer)
    })
    return {
      total: pages.length,
      hidden: pages.filter((p) => p.hidden).length,
      pending: proposals.filter((p) => p.status === 'pending').length,
      contributors: contributors.size,
    }
  }, [pages, proposals])

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = pages
      .map((page) => ({ page, title: meta[page.slug]?.title || page.slug }))
      .filter(
        (r) =>
          !q ||
          r.title.toLowerCase().includes(q) ||
          r.page.slug.toLowerCase().includes(q)
      )
    const cmp = SORTS[sort.key] ?? SORTS.title
    list.sort((a, b) => (sort.dir === 'asc' ? cmp(a, b) : -cmp(a, b)))
    return list
  }, [pages, meta, query, sort])

  if (!canModerate) return <Navigate to={PATH.WIKI} replace />

  const toggleHidden = async (page) => {
    setBusySlug(page.slug)
    try {
      await setPageHidden({ slug: page.slug, hidden: !page.hidden })
      refresh()
    } catch {
      // surfaced via modal
    } finally {
      setBusySlug(null)
    }
  }

  return (
    <article className={styles.article}>
      <h2>Wiki admin</h2>

      <div className={styles.stats}>
        <div className={styles.stat}>
          <span className={styles.stat_num}>{stats.total}</span>
          <span className={styles.stat_label}>pages</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.stat_num}>{stats.hidden}</span>
          <span className={styles.stat_label}>hidden</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.stat_num}>{stats.pending}</span>
          <span className={styles.stat_label}>pending proposals</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.stat_num}>{stats.contributors}</span>
          <span className={styles.stat_label}>contributors</span>
        </div>
      </div>

      <input
        type="search"
        className={styles.admin_search}
        placeholder="Filter by title or slug…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      <div className={styles.table_wrap}>
        <table className={styles.admin_table}>
          <thead>
            <tr>
              <SortHeader
                label="Title"
                sortKey="title"
                sort={sort}
                setSort={setSort}
              />
              <th>Slug</th>
              <SortHeader
                label="Ver"
                sortKey="version"
                sort={sort}
                setSort={setSort}
              />
              <th>Last edited by</th>
              <SortHeader
                label="Updated"
                sortKey="updated"
                sort={sort}
                setSort={setSort}
              />
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className={styles.notice}>
                  No pages match.
                </td>
              </tr>
            ) : (
              rows.map(({ page, title }) => (
                <tr
                  key={page.slug}
                  className={page.hidden ? styles.row_hidden : ''}
                >
                  <td>
                    <Link to={`${PATH.WIKI}/${page.slug}`}>{title}</Link>
                    {page.hidden && (
                      <span className={styles.hidden_tag}> (hidden)</span>
                    )}
                  </td>
                  <td className={styles.mono}>{page.slug}</td>
                  <td>{page.versionCount}</td>
                  <td>
                    <Link to={`/tz/${page.editor}`}>
                      {profiles[page.editor]?.alias ||
                        walletPreview(page.editor)}
                    </Link>
                  </td>
                  <td>{new Date(page.updatedAt).toLocaleDateString()}</td>
                  <td className={styles.row_actions}>
                    <Button small shadow_box to={`${PATH.WIKI}/${page.slug}`}>
                      View
                    </Button>
                    <Button
                      small
                      shadow_box
                      to={`${PATH.WIKI}/${page.slug}/edit`}
                    >
                      Edit
                    </Button>
                    <Button
                      small
                      shadow_box
                      to={`${PATH.WIKI}/${page.slug}/history`}
                    >
                      History
                    </Button>
                    <Button
                      small
                      shadow_box
                      disabled={busySlug === page.slug}
                      onClick={() => toggleHidden(page)}
                    >
                      {page.hidden ? 'Unhide' : 'Hide'}
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <h2 className={styles.admin_proposals_head}>
        Pending proposals ({stats.pending})
      </h2>
      <WikiProposalList
        proposals={proposals}
        canModerate={canModerate}
        refresh={refresh}
        pendingOnly
      />
    </article>
  )
}
