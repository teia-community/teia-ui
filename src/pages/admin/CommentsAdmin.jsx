import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@atoms/button'
import { Loading } from '@atoms/loading'
import { walletPreview } from '@utils/string'
import { getTimeAgo } from '@utils/time'
import { useUserProfiles } from '@data/roles'
import {
  useRecentComments,
  useBannedList,
  usePauseState,
  commentContractFor,
} from '@data/messaging/admin'
import * as pollActions from '@data/messaging/poll-comments-actions'
import * as tokenActions from '@data/messaging/token-comments-actions'
import StatCard from './StatCard'
import ModerationTable from './ModerationTable'
import BanListManager from './BanListManager'
import PauseToggle from './PauseToggle'
import styles from '@style'

function preview(text, len = 90) {
  const t = (text ?? '').replace(/\s+/g, ' ').trim()
  return t.length > len ? t.slice(0, len) + '…' : t || '(empty)'
}

function topicLinkFor(c) {
  if (c.kind === 'poll') {
    return { href: `/poll/${c.pollId}`, label: `Poll #${c.pollId}` }
  }
  return { href: `/objkt/${c.tokenId}/comments`, label: `OBJKT #${c.tokenId}` }
}

/**
 * Moderation tab for a comments contract.
 */
export default function CommentsAdmin({ kind }) {
  const actions = kind === 'poll' ? pollActions : tokenActions
  const contract = commentContractFor(kind)

  const {
    data: comments,
    isLoading,
    mutate: refreshComments,
  } = useRecentComments(kind)
  const { data: banned = [], mutate: refreshBanned } = useBannedList(contract)
  const { data: paused, mutate: refreshPaused } = usePauseState(contract)

  const [busyId, setBusyId] = useState(null)

  const addrs = useMemo(() => {
    const set = new Set(banned)
    for (const c of comments ?? []) set.add(c.sender)
    return [...set]
  }, [comments, banned])
  const { data: profiles = {} } = useUserProfiles(addrs)

  const stats = useMemo(() => {
    const list = comments ?? []
    return {
      recent: list.length,
      hidden: list.filter((c) => c.hidden).length,
      authors: new Set(list.map((c) => c.sender)).size,
    }
  }, [comments])

  const toggleHidden = async (c) => {
    setBusyId(c.id)
    try {
      const args =
        kind === 'poll'
          ? { commentId: c.id, pollId: c.pollId, hidden: !c.hidden }
          : {
              commentId: c.id,
              fa2Address: c.fa2Address,
              tokenId: c.tokenId,
              hidden: !c.hidden,
            }
      await actions.moderateCommentHidden(args)
      refreshComments()
    } catch {
      // surfaced via modal
    } finally {
      setBusyId(null)
    }
  }

  const banSender = async (address) => {
    await actions.setUserBanned({ address, banned: true })
    refreshBanned()
  }
  const unbanSender = async (address) => {
    await actions.setUserBanned({ address, banned: false })
    refreshBanned()
  }
  const togglePause = async (next) => {
    await actions.setPaused(next)
    refreshPaused()
  }

  const renderRow = (c) => {
    const topic = topicLinkFor(c)
    const alias = profiles[c.sender]?.alias || walletPreview(c.sender)
    return (
      <tr key={c.id} className={c.hidden ? styles.row_hidden : ''}>
        <td>
          <Link to={`/tz/${c.sender}`}>{alias}</Link>
        </td>
        <td className={styles.cell_content}>
          {preview(c.content)}
          {c.hidden && <span className={styles.hidden_tag}> (hidden)</span>}
        </td>
        <td>
          <Link to={topic.href}>{topic.label}</Link>
        </td>
        <td className={styles.muted}>{getTimeAgo(c.timestamp)}</td>
        <td className={styles.row_actions}>
          <Button
            small
            shadow_box
            disabled={busyId === c.id}
            onClick={() => toggleHidden(c)}
          >
            {c.hidden ? 'Unhide' : 'Hide'}
          </Button>
          <Button
            small
            shadow_box
            disabled={banned.includes(c.sender)}
            onClick={() => banSender(c.sender)}
          >
            {banned.includes(c.sender) ? 'Banned' : 'Ban'}
          </Button>
        </td>
      </tr>
    )
  }

  return (
    <div className={styles.tab_body}>
      <div className={styles.stats}>
        <StatCard
          label="Recent comments"
          value={stats.recent}
          sublabel="loaded"
        />
        <StatCard label="Hidden (in view)" value={stats.hidden} />
        <StatCard label="Unique authors" value={stats.authors} />
        <StatCard label="Banned users" value={banned.length} />
      </div>

      <h3 className={styles.section_head}>Recent comments</h3>
      {isLoading ? (
        <Loading message="Loading comments…" />
      ) : (
        <ModerationTable
          items={comments ?? []}
          headers={['Author', 'Comment', 'Topic', 'Posted', 'Actions']}
          renderRow={renderRow}
          searchText={(c) =>
            `${c.sender} ${c.content} ${c.pollId ?? ''} ${c.tokenId ?? ''}`
          }
          emptyLabel="No comments match."
        />
      )}

      <PauseToggle
        label="Comments contract"
        paused={Boolean(paused)}
        onToggle={togglePause}
      />

      <BanListManager
        banned={banned}
        profiles={profiles}
        onBan={banSender}
        onUnban={unbanSender}
      />
    </div>
  )
}
