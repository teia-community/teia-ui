import { useMemo, useState } from 'react'
import { useOutletContext, Link } from 'react-router-dom'
import useSWR from 'swr'
import { Button } from '@atoms/button'
import { Identicon } from '@atoms/identicons'
import { PATH, WIKI_CONTRACT } from '@constants'
import { walletPreview } from '@utils/string'
import { getTimeAgo } from '@utils/time'
import { msgIpfsToUrl } from '@data/messaging/ipfs'
import { useUserProfiles } from '@data/messaging/token-comments'
import {
  approveProposal,
  rejectProposal,
  fetchOpHash,
  useWikiPageContent,
} from '@data/wiki'
import { WikiMarkdown } from '@components/wiki'
import styles from '@style'

const PREVIEW_LEN = 100

function ProposalCard({ proposal, canModerate, refresh, alias, logo }) {
  const [busy, setBusy] = useState(false)
  const [showMore, setShowMore] = useState(false)
  const { data: content, error } = useWikiPageContent(proposal.proposedCid)
  const { data: opHash } = useSWR(
    proposal.transactionId ? `wiki:ophash:${proposal.transactionId}` : null,
    () => fetchOpHash(proposal.transactionId)
  )

  const tzktUrl = opHash
    ? `https://tzkt.io/${opHash}`
    : `https://tzkt.io/${WIKI_CONTRACT}/operations`

  const act = async (fn) => {
    setBusy(true)
    try {
      await fn(proposal.id)
      refresh()
    } catch {
      // surfaced via modal
    } finally {
      setBusy(false)
    }
  }

  const body = content?.content || ''
  const teaser = body.replace(/\s+/g, ' ').trim().slice(0, PREVIEW_LEN)
  const hasMore = body.trim().length > teaser.length

  return (
    <li className={styles.proposal_card}>
      <div className={styles.proposal_head}>
        <span className={styles.proposal_kind}>
          {proposal.isNewPage ? 'New page' : 'Edit'}
        </span>
        <Link to={`${PATH.WIKI}/${proposal.pageSlug}`}>
          {proposal.pageSlug}
        </Link>
        <span
          className={`${styles.proposal_status} ${styles[proposal.status]}`}
        >
          {proposal.status}
        </span>
      </div>

      <div className={styles.proposer}>
        <Link
          to={`/tz/${proposal.proposer}`}
          className={styles.proposer_avatar}
        >
          <Identicon address={proposal.proposer} logo={logo} />
        </Link>
        <div className={styles.proposer_meta}>
          <Link
            to={`/tz/${proposal.proposer}`}
            className={styles.proposer_name}
          >
            {alias || walletPreview(proposal.proposer)}
          </Link>
          <span className={styles.proposal_sub}>
            #{proposal.id} · {getTimeAgo(proposal.createdAt)}
            {proposal.resolvedBy &&
              ` · ${proposal.status} by ${walletPreview(proposal.resolvedBy)}`}
          </span>
        </div>
      </div>

      <div className={styles.proposal_preview}>
        {!content && !error ? (
          <p className={styles.notice}>Loading preview…</p>
        ) : showMore ? (
          <WikiMarkdown>{body}</WikiMarkdown>
        ) : (
          <p className={styles.preview_text}>
            {teaser}
            {hasMore && '…'}
          </p>
        )}
        {hasMore && (
          <button
            type="button"
            className={styles.show_more}
            onClick={() => setShowMore((s) => !s)}
          >
            {showMore ? '− Show less' : '+ Show more'}
          </button>
        )}
      </div>

      <p className={styles.proposal_links}>
        <a
          href={msgIpfsToUrl(proposal.proposedCid)}
          target="_blank"
          rel="noreferrer"
        >
          IPFS
        </a>
        <span className={styles.link_sep}>·</span>
        <a href={tzktUrl} target="_blank" rel="noreferrer">
          tzkt
        </a>
      </p>

      {canModerate && proposal.status === 'pending' && (
        <div className={styles.proposal_actions}>
          <Button
            small
            shadow_box
            disabled={busy}
            onClick={() => act(approveProposal)}
          >
            Approve
          </Button>
          <Button
            small
            secondary
            shadow_box
            disabled={busy}
            onClick={() => act(rejectProposal)}
          >
            Reject
          </Button>
        </div>
      )}
    </li>
  )
}

export default function WikiProposals() {
  const { wiki, canModerate, refresh } = useOutletContext()
  const proposals = useMemo(() => wiki?.proposals || [], [wiki?.proposals])
  const pending = proposals.filter((p) => p.status === 'pending')
  const resolved = proposals.filter((p) => p.status !== 'pending')

  const proposerAddrs = useMemo(
    () => [...new Set(proposals.map((p) => p.proposer))],
    [proposals]
  )
  const { data: profiles = {} } = useUserProfiles(proposerAddrs)

  const renderCard = (p) => (
    <ProposalCard
      key={p.id}
      proposal={p}
      canModerate={canModerate}
      refresh={refresh}
      alias={profiles[p.proposer]?.alias}
      logo={profiles[p.proposer]?.logo}
    />
  )

  return (
    <article className={styles.article}>
      <h2>Community proposals</h2>

      <h3>Pending ({pending.length})</h3>
      {pending.length === 0 ? (
        <p className={styles.notice}>No pending proposals.</p>
      ) : (
        <ul className={styles.proposal_list}>
          {pending.slice().reverse().map(renderCard)}
        </ul>
      )}

      {resolved.length > 0 && (
        <>
          <h3>Resolved</h3>
          <ul className={styles.proposal_list}>
            {resolved.slice().reverse().map(renderCard)}
          </ul>
        </>
      )}
    </article>
  )
}
