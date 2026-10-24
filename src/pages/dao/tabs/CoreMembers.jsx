import { useMemo, useState } from 'react'
import { Loading } from '@atoms/loading'
import { Identicon } from '@atoms/identicons'
import { walletPreview } from '@utils/string'
import { HashToURL } from '@utils'
import { getWordDate } from '@utils/time'
import { MEMBER_SORTS, sortMembers, memberName } from '@utils/dao-members.mjs'
import { useDaoMembers } from '@data/multisig'
import { ActivityControls } from '@components/activity'
import styles from './index.module.scss'

function formatTokens(amount) {
  return amount.toLocaleString(undefined, { maximumFractionDigits: 0 })
}

/** One member's voting record, shown when their row is opened. */
function VotingRecord({ member, proposals }) {
  const record = useMemo(() => {
    return [...member.votes]
      .map((vote) => ({ ...vote, proposal: proposals[vote.proposalId] }))
      .sort((a, b) => Number(b.proposalId) - Number(a.proposalId))
  }, [member.votes, proposals])

  if (record.length === 0) {
    return (
      <p className={styles.member_empty}>
        {memberName(member)} has not voted on any proposal yet.
      </p>
    )
  }

  return (
    <div className={styles.record}>
      <p className={styles.member_empty}>
        {member.votesCast} vote{member.votesCast === 1 ? '' : 's'} cast,{' '}
        {member.votesInFavour} in favour.
      </p>
      <div className={styles.record_head}>
        <span>Proposal</span>
        <span>Kind</span>
        <span>Voted</span>
        <span>Outcome</span>
      </div>
      {record.map((entry) => (
        <div className={styles.record_row} key={entry.proposalId}>
          <span>
            #{entry.proposalId}
            {entry.proposal?.text && (
              <>
                {' · '}
                <a
                  href={HashToURL(entry.proposal.text)}
                  target="_blank"
                  rel="noreferrer"
                >
                  read the text
                </a>
              </>
            )}
          </span>
          <span>{entry.proposal?.kind ?? '—'}</span>
          <span
            className={entry.inFavour ? styles.vote_for : styles.vote_against}
          >
            {entry.inFavour ? 'In favour' : 'Against'}
          </span>
          <span
            className={
              entry.proposal?.executed ? styles.outcome_done : styles.outcome_no
            }
          >
            {entry.proposal
              ? entry.proposal.executed
                ? 'Executed'
                : 'Not executed'
              : '—'}
          </span>
        </div>
      ))}
    </div>
  )
}

function MemberRow({ member, proposals, open, onToggle, voteCount }) {
  // How much of the voting they have taken part in, while they were there.
  const share = voteCount > 0 ? Math.min(member.votesCast / voteCount, 1) : 0
  return (
    <div
      className={`${styles.member} ${
        member.isCurrent ? '' : styles.member_past
      }`}
    >
      <button
        type="button"
        className={styles.member_row}
        onClick={onToggle}
        aria-expanded={open}
      >
        <Identicon address={member.address} className={styles.member_avatar} />
        <span className={styles.member_name}>
          {member.alias || walletPreview(member.address)}
          <small>{walletPreview(member.address)}</small>
        </span>
        <span className={styles.member_stat}>
          {formatTokens(member.tokens)} TEIA
        </span>
        <span className={styles.member_stat}>
          {member.joined ? getWordDate(member.joined) : 'unknown'}
          {member.left && <small>left {getWordDate(member.left)}</small>}
        </span>
        <span className={styles.member_stat}>
          {member.votesCast} votes
          <span
            className={styles.turnout}
            title={`${member.votesCast} of ${voteCount} proposals`}
          >
            <span
              className={styles.turnout_fill}
              style={{ width: `${share * 100}%` }}
            />
          </span>
        </span>
      </button>
      {open && <VotingRecord member={member} proposals={proposals} />}
    </div>
  )
}

/** The multisig's members, past and present. Shown inside the multisig tab. */
export function CoreMembers() {
  const { members, proposals, error, isLoading } = useDaoMembers()
  const [sort, setSort] = useState('name')
  const [openAddress, setOpenAddress] = useState(null)

  const { current, emeritus } = useMemo(() => {
    return {
      current: sortMembers(
        members.filter((m) => m.isCurrent),
        sort
      ),
      emeritus: sortMembers(
        members.filter((m) => !m.isCurrent),
        sort
      ),
    }
  }, [members, sort])

  if (error) {
    return (
      <p className={styles.member_empty}>
        Error loading members: {error.message}
      </p>
    )
  }

  if (isLoading) {
    return <Loading message="Loading core members" />
  }

  const voteCount = Object.keys(proposals).length

  const renderGroup = (list) =>
    list.map((member) => (
      <MemberRow
        key={member.address}
        member={member}
        proposals={proposals}
        voteCount={voteCount}
        open={openAddress === member.address}
        onToggle={() =>
          setOpenAddress(openAddress === member.address ? null : member.address)
        }
      />
    ))

  return (
    <div className={styles.members}>
      <ActivityControls
        sort={sort}
        onSortChange={setSort}
        options={MEMBER_SORTS}
        ariaLabel="Sort core members"
      />

      <h2 className={styles.member_heading}>
        Core members <small>{current.length}</small>
      </h2>
      {renderGroup(current)}

      {emeritus.length > 0 && (
        <>
          <h2 className={styles.member_heading}>
            Emeritus <small>{emeritus.length}</small>
          </h2>
          {renderGroup(emeritus)}
        </>
      )}
    </div>
  )
}

export default CoreMembers
