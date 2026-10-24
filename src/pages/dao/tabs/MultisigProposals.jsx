import { useMemo, useState } from 'react'
import { Loading } from '@atoms/loading'
import { Button } from '@atoms/button'
import { walletPreview } from '@utils/string'
import { getWordDate } from '@utils/time'
import {
  PROPOSAL_STATUSES,
  kindLabel,
  timeUntil,
} from '@utils/multisig-proposals.mjs'
import { useMultisigProposals } from '@data/multisig'
import { DAO_TREASURY_CONTRACT } from '@constants'
import { HashToURL } from '@utils'
import styles from './index.module.scss'

const PAGE = 15

/** Text proposals store an ipfs link to the written proposal. */
function textProposalLink(text) {
  if (!text?.startsWith('ipfs://')) return null
  return HashToURL(text)
}

/** What a proposal does, in a line, from the fields the contract keeps. */
function describe(proposal) {
  if (proposal.text) {
    const href = textProposalLink(proposal.text)
    if (!href) return proposal.text
    return (
      <a href={href} target="_blank" rel="noreferrer">
        Text proposal
      </a>
    )
  }
  switch (proposal.rawKind) {
    case 'add_user':
      return `Add ${walletPreview(proposal.user || '')} to the multisig`
    case 'remove_user':
      return `Remove ${walletPreview(proposal.user || '')} from the multisig`
    case 'transfer_mutez':
      return 'Transfer tez from the treasury'
    case 'transfer_token':
      return 'Transfer tokens from the treasury'
    case 'minimum_votes':
      return 'Change the number of votes a proposal needs'
    case 'expiration_time':
      return 'Change how long proposals stay open'
    case 'lambda_function':
      return 'Run a lambda on the treasury contract'
    default:
      return proposal.kind
  }
}

function ProposalRow({ proposal }) {
  return (
    <div className={styles.proposal}>
      <div className={styles.proposal_head}>
        <span className={styles.proposal_kind}>
          {kindLabel(proposal.rawKind)}
        </span>
        <span className={styles.proposal_id}>#{proposal.id}</span>
        <span className={styles.proposal_desc}>{describe(proposal)}</span>
        <span className={styles.proposal_when}>
          {proposal.status === 'active' && proposal.expiresAt
            ? `expires ${timeUntil(proposal.expiresAt)}`
            : getWordDate(proposal.timestamp)}
        </span>
      </div>
      <div className={styles.proposal_votes}>
        <span>{proposal.inFavour} in favour</span>
        <span>{proposal.against} against</span>
        <span>
          {proposal.silent} {proposal.silentLabel}
        </span>
        <span className={styles.proposal_issuer}>
          proposed by {walletPreview(proposal.issuer)}
        </span>
      </div>
    </div>
  )
}

/** DAO page tab: the core team's multisig proposals. */
export default function MultisigProposals() {
  const { proposals, memberCount, quorum, expirationDays, error, isLoading } =
    useMultisigProposals()
  const [status, setStatus] = useState('active')
  const [shown, setShown] = useState(PAGE)

  const grouped = useMemo(() => {
    const groups = { active: [], executed: [], expired: [] }
    for (const proposal of proposals) groups[proposal.status]?.push(proposal)
    return groups
  }, [proposals])

  if (error) {
    return (
      <p className={styles.member_empty}>
        Error loading proposals: {error.message}
      </p>
    )
  }

  if (isLoading) return <Loading message="Loading multisig proposals" />

  const list = grouped[status] ?? []
  const visible = list.slice(0, shown)

  return (
    <section className={styles.section}>
      <h1 className={styles.section_title}>Multisig proposals</h1>

      <p className={styles.proposal_intro}>
        The core team multisig is the contract through which Teia conducts its
        day-to-day operations: approving budgets, awarding grants, funding
        events, and settling the operational matters involved in keeping
        teia.art running. Each proposal is signed on-chain by the core team, and
        requires {quorum} of {memberCount} members in favour to be executed.
        Proposals that do not reach that threshold within {expirationDays} days
        expire and can no longer be voted on or executed.
      </p>
      <p className={styles.proposal_intro}>
        These decisions operate within the mandate set by the DAO. Where the two
        differ, a DAO proposal — voted on by all TEIA token holders — takes
        precedence.
      </p>

      <div className={styles.proposal_tabs}>
        {PROPOSAL_STATUSES.map((option) => (
          <button
            type="button"
            key={option.key}
            className={`${styles.proposal_tab} ${
              status === option.key ? styles.proposal_tab_active : ''
            }`}
            onClick={() => {
              setStatus(option.key)
              setShown(PAGE)
            }}
          >
            {option.label}
            <small>{grouped[option.key]?.length ?? 0}</small>
          </button>
        ))}
      </div>

      {status === 'expired' && list.length > 0 && (
        <p className={styles.member_empty}>
          These proposals can no longer be voted on or executed.
        </p>
      )}

      {list.length === 0 ? (
        <p className={styles.member_empty}>
          No {status} proposals at the moment.
        </p>
      ) : (
        visible.map((proposal) => (
          <ProposalRow key={proposal.id} proposal={proposal} />
        ))
      )}

      {shown < list.length && (
        <div className={styles.proposal_more}>
          <Button shadow_box onClick={() => setShown(shown + PAGE)}>
            Show {Math.min(PAGE, list.length - shown)} more
          </Button>
        </div>
      )}

      <p className={styles.member_empty}>
        Full history on{' '}
        <a
          href={`https://tzkt.io/${DAO_TREASURY_CONTRACT}/operations`}
          target="_blank"
          rel="noreferrer"
        >
          TzKT
        </a>
        .
      </p>
    </section>
  )
}
