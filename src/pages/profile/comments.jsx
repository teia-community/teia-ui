import { useMemo, useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import { Loading } from '@atoms/loading'
import {
  useUserComments,
  useUserProfiles,
} from '@data/messaging/token-comments'
import { walletPreview } from '@utils/string'
import { getTimeAgo } from '@utils/time'
import { Identicon } from '@atoms/identicons'
import styles from './comments.module.scss'
import commentStyles from '@components/token-comments/index.module.scss'

export default function ProfileComments() {
  const { address } = useOutletContext()
  const { data: comments, isLoading } = useUserComments(address)
  const [groupByToken, setGroupByToken] = useState(false)

  const senderAddrs = useMemo(
    () => (comments ?? []).map((c) => c.sender),
    [comments]
  )
  const { data: profiles = {} } = useUserProfiles(senderAddrs)

  if (isLoading) return <Loading message="Loading comments" />

  const visibleComments = (comments ?? []).filter((c) => !c.hidden)

  if (visibleComments.length === 0) {
    return (
      <div className={styles.empty}>
        <p>No comments yet.</p>
      </div>
    )
  }

  // Group by token if toggled
  const grouped = groupByToken
    ? visibleComments.reduce((acc, c) => {
        const key = `${c.fa2Address}:${c.tokenId}`
        if (!acc[key])
          acc[key] = {
            fa2Address: c.fa2Address,
            tokenId: c.tokenId,
            comments: [],
          }
        acc[key].comments.push(c)
        return acc
      }, {})
    : null

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.count}>
          {visibleComments.length}{' '}
          {visibleComments.length === 1 ? 'comment' : 'comments'}
        </span>
        <button
          className={styles.viewToggle}
          onClick={() => setGroupByToken((v) => !v)}
          aria-pressed={groupByToken}
        >
          {groupByToken ? '↕ Chronological' : '▦ Group by token'}
        </button>
      </div>

      {groupByToken && grouped ? (
        Object.values(grouped).map((group) => (
          <div
            key={`${group.fa2Address}:${group.tokenId}`}
            className={styles.tokenGroup}
          >
            <Link
              to={`/objkt/${group.tokenId}/comments`}
              className={styles.tokenLink}
            >
              <span className={styles.objktText}>OBJKT</span>#{group.tokenId}
              <span className={styles.tokenLinkCount}>
                {group.comments.length}{' '}
                {group.comments.length === 1 ? 'comment' : 'comments'}
              </span>
            </Link>
            <div className={styles.commentList}>
              {group.comments.map((c) => (
                <ProfileCommentItem
                  key={c.id}
                  comment={c}
                  profiles={profiles}
                />
              ))}
            </div>
          </div>
        ))
      ) : (
        <div className={styles.commentList}>
          {visibleComments.map((c) => (
            <ProfileCommentItem
              key={c.id}
              comment={c}
              profiles={profiles}
              showTokenLink
            />
          ))}
        </div>
      )}
    </div>
  )
}

function ProfileCommentItem({ comment, profiles, showTokenLink = false }) {
  const alias = profiles[comment.sender]?.alias || walletPreview(comment.sender)
  const logo = profiles[comment.sender]?.logo
  const isEdited = comment.version > 1

  return (
    <div className={commentStyles.comment}>
      <Link to={`/tz/${comment.sender}`} className={commentStyles.avatarLink}>
        <Identicon
          address={comment.sender}
          logo={logo}
          className={commentStyles.avatar}
        />
      </Link>
      <div className={commentStyles.body}>
        <div className={commentStyles.head}>
          <Link to={`/tz/${comment.sender}`} className={commentStyles.sender}>
            {alias}
          </Link>
          <span className={commentStyles.time}>
            {getTimeAgo(comment.timestamp)}
            {isEdited && (
              <span className={commentStyles.edited}> · edited</span>
            )}
          </span>
          {showTokenLink && (
            <Link
              to={`/objkt/${comment.tokenId}/comments`}
              className={styles.inlineTokenLink}
            >
              on <span className={styles.objktText}>OBJKT</span>#
              {comment.tokenId}
            </Link>
          )}
        </div>
        <div className={commentStyles.content}>{comment.content}</div>
      </div>
    </div>
  )
}
