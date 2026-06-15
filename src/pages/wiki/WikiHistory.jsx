import { useState, useMemo } from 'react'
import { useOutletContext, useParams, Link } from 'react-router-dom'
import { Button } from '@atoms/button'
import { PATH } from '@constants'
import { walletPreview } from '@utils/string'
import { msgIpfsToUrl } from '@data/messaging/ipfs'
import { useUserProfiles } from '@data/messaging/token-comments'
import { useWikiVersions, useWikiPageContent } from '@data/wiki'
import { WikiMarkdown } from '@components/wiki'
import styles from '@style'

function VersionRow({ version, isCurrent, profiles }) {
  const [open, setOpen] = useState(false)
  const { data: content, error } = useWikiPageContent(
    open ? version.cid : undefined
  )

  return (
    <li className={styles.version_row}>
      <div className={styles.version_head}>
        <span className={styles.version_no}>
          v{version.version}
          {isCurrent && <span className={styles.current_tag}> (current)</span>}
        </span>
        <span className={styles.version_meta}>
          by{' '}
          <Link to={`/tz/${version.editor}`}>
            {profiles[version.editor]?.alias || walletPreview(version.editor)}
          </Link>
          {version.proposer && (
            <>
              {' · proposed by '}
              <Link to={`/tz/${version.proposer}`}>
                {profiles[version.proposer]?.alias ||
                  walletPreview(version.proposer)}
              </Link>
            </>
          )}
          {' · '}
          {new Date(version.timestamp).toLocaleString()}
        </span>
        <span className={styles.version_links}>
          <Button small secondary onClick={() => setOpen((o) => !o)}>
            {open ? 'Hide' : 'Preview'}
          </Button>
          <a href={msgIpfsToUrl(version.cid)} target="_blank" rel="noreferrer">
            IPFS
          </a>
        </span>
      </div>
      {open && (
        <div className={styles.version_preview}>
          {!content && !error ? (
            <p className={styles.notice}>Loading…</p>
          ) : (
            <WikiMarkdown>{content?.content}</WikiMarkdown>
          )}
        </div>
      )}
    </li>
  )
}

export default function WikiHistory() {
  const { slug } = useParams()
  const { wiki } = useOutletContext()
  const { data: versions, error } = useWikiVersions(slug)
  const page = wiki?.pages.find((p) => p.slug === slug)
  const title = wiki?.meta[slug]?.title || slug

  const addrs = useMemo(() => {
    const s = new Set()
    ;(versions || []).forEach((v) => {
      s.add(v.editor)
      if (v.proposer) s.add(v.proposer)
    })
    return [...s]
  }, [versions])
  const { data: profiles = {} } = useUserProfiles(addrs)

  return (
    <article className={styles.article}>
      <div className={styles.page_head}>
        <h2>History: {title}</h2>
        <Button small secondary to={`${PATH.WIKI}/${slug}`}>
          Back to page
        </Button>
      </div>

      {!versions && !error ? (
        <p className={styles.notice}>Loading history…</p>
      ) : !versions?.length ? (
        <p className={styles.notice}>No version history found.</p>
      ) : (
        <ul className={styles.version_list}>
          {versions.map((v) => (
            <VersionRow
              key={v.version}
              version={v}
              isCurrent={v.version === page?.versionCount}
              profiles={profiles}
            />
          ))}
        </ul>
      )}
    </article>
  )
}
