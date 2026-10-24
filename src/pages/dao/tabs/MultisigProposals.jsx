import { useMemo, useState } from 'react'
import { Loading } from '@atoms/loading'
import { Button } from '@atoms/button'
import { walletPreview } from '@utils/string'
import { getWordDate } from '@utils/time'
import {
  PROPOSAL_STATUSES,
  kindLabel,
  timeUntil,
  describeProposal,
  quorumProgress,
  formatTokenAmount,
} from '@utils/multisig-proposals.mjs'
import { useMultisigProposals, useDaoMembers } from '@data/multisig'
import { useTokenInfo } from '@data/token-metadata'
import { TezRateControls, useTezRate } from '@components/dao/TezRate'
import { formatConverted } from '@data/tez-quote'
import { CoreMembers } from './CoreMembers'
import ModeratorManagement from '@components/moderators/ModeratorManagement'
import { DAO_TREASURY_CONTRACT, MODERATOR_CONTRACT } from '@constants'
import { HashToURL } from '@utils'
import styles from './index.module.scss'

const PAGE = 15

/** The sub-tabs: the three proposal states, then the people who vote on them. */
const VIEWS = [
  ...PROPOSAL_STATUSES,
  { key: 'members', label: 'Core members' },
  { key: 'moderators', label: 'Moderators' },
]

/** Views that list proposals; the others render their own thing. */
const PROPOSAL_VIEWS = new Set(PROPOSAL_STATUSES.map((view) => view.key))

/** Text proposals store an ipfs link to the written proposal. */
function textProposalLink(text) {
  if (!text?.startsWith('ipfs://')) return null
  return HashToURL(text)
}

/** How close a proposal is to the votes it needs. */
function QuorumMeter({ inFavour, quorum }) {
  const share = quorumProgress(inFavour, quorum)
  return (
    <div
      className={styles.quorum}
      role="img"
      aria-label={`${inFavour} of ${quorum} votes needed`}
    >
      <div className={styles.quorum_track}>
        <div
          className={styles.quorum_fill}
          style={{ width: `${share * 100}%` }}
        />
      </div>
      <span className={styles.quorum_label}>
        {inFavour}/{quorum} in favour
      </span>
    </div>
  )
}

function ProposalRow({ proposal, quorum, aliasOf, tokenInfo, tezRate }) {
  const href = textProposalLink(proposal.text)
  const summary = describeProposal(proposal, { aliasOf, tokenInfo })

  // Only tez converts; a stablecoin is already money and the rate is for tez.
  const tezTotal =
    proposal.rawKind === 'transfer_mutez'
      ? (proposal.mutezTransfers ?? []).reduce(
          (sum, t) => sum + Number(t.amount || 0),
          0
        ) / 1000000
      : null
  const converted =
    tezTotal != null && tezRate.rate != null
      ? formatConverted(tezTotal, tezRate.rate, tezRate.currency)
      : null

  return (
    <div className={styles.proposal}>
      <div className={styles.proposal_head}>
        <span className={styles.proposal_kind}>
          {kindLabel(proposal.rawKind)}
        </span>
        <span className={styles.proposal_id}>#{proposal.id}</span>
        <span className={styles.proposal_desc}>
          {href ? (
            <a href={href} target="_blank" rel="noreferrer">
              {summary}
            </a>
          ) : (
            summary
          )}
        </span>
        {converted && (
          <span className={styles.proposal_converted}>≈ {converted}</span>
        )}
        <span className={styles.proposal_when}>
          {proposal.status === 'active' && proposal.expiresAt
            ? `expires ${timeUntil(proposal.expiresAt)}`
            : getWordDate(proposal.timestamp)}
        </span>
      </div>

      <div className={styles.proposal_body}>
        <QuorumMeter inFavour={proposal.inFavour} quorum={quorum} />
        <div className={styles.proposal_votes}>
          <span className={styles.vote_against}>
            {proposal.against} against
          </span>
          <span>
            {proposal.silent} {proposal.silentLabel}
          </span>
          <span className={styles.proposal_issuer}>
            proposed by{' '}
            {aliasOf(proposal.issuer) || walletPreview(proposal.issuer)}
          </span>
        </div>
      </div>

      {proposal.mutezTransfers?.length > 1 && (
        <ul className={styles.proposal_detail}>
          {proposal.mutezTransfers.map((t, i) => (
            <li key={`${t.destination}-${i}`}>
              {(Number(t.amount) / 1000000).toLocaleString(undefined, {
                maximumFractionDigits: 2,
              })}{' '}
              ꜩ to {walletPreview(t.destination)}
            </li>
          ))}
        </ul>
      )}

      {proposal.tokenTransfers?.distribution?.length > 1 && (
        <ul className={styles.proposal_detail}>
          {proposal.tokenTransfers.distribution.map((t, i) => (
            <li key={`${t.destination}-${i}`}>
              {formatTokenAmount(
                t.amount,
                tokenInfo(
                  proposal.tokenTransfers.fa2,
                  proposal.tokenTransfers.tokenId
                )
              )}{' '}
              to {walletPreview(t.destination)}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/** DAO page tab: the core team's multisig proposals. */
export default function MultisigProposals() {
  const { proposals, memberCount, quorum, expirationDays, error, isLoading } =
    useMultisigProposals()
  const { members } = useDaoMembers()

  const tokenKeys = useMemo(
    () =>
      proposals
        .filter((p) => p.tokenTransfers?.fa2)
        .map((p) => `${p.tokenTransfers.fa2}:${p.tokenTransfers.tokenId}`),
    [proposals]
  )
  const tokenInfo = useTokenInfo(tokenKeys)
  const tezRate = useTezRate()

  // Members past and present, so a proposal that removed someone can still
  // name them.
  const aliasOf = useMemo(() => {
    const names = new Map(
      members.filter((m) => m.alias).map((m) => [m.address, m.alias])
    )
    return (address) => names.get(address) || null
  }, [members])
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
        events, setting the marketplace fees, and settling the operational
        matters involved in keeping teia.art running. Each proposal is signed
        on-chain by the core team, and requires {quorum} of {memberCount}{' '}
        members in favour to be executed. Proposals that do not reach that
        threshold within {expirationDays} days expire and can no longer be voted
        on or executed.
      </p>
      <p className={styles.proposal_intro}>
        These decisions operate within the mandate set by the DAO. Where the two
        differ, a DAO proposal — voted on by all TEIA token holders — takes
        precedence.
      </p>

      <div className={styles.proposal_tabs}>
        {VIEWS.map((option) => (
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
            {option.key === 'members' && <small>{memberCount}</small>}
            {PROPOSAL_VIEWS.has(option.key) && (
              <small>{grouped[option.key]?.length ?? 0}</small>
            )}
          </button>
        ))}
      </div>

      {status === 'members' && <CoreMembers />}

      {status === 'moderators' && (
        <>
          <p className={styles.member_empty}>
            Moderators act on reported content. They are appointed and removed
            by the core team, through a vote in the moderator contract rather
            than a multisig proposal.
          </p>
          <ModeratorManagement
            contract={MODERATOR_CONTRACT}
            multisig={DAO_TREASURY_CONTRACT}
            title="Teia moderators"
          />
        </>
      )}

      {status === 'expired' && list.length > 0 && (
        <p className={styles.member_empty}>
          These proposals can no longer be voted on or executed.
        </p>
      )}

      {PROPOSAL_VIEWS.has(status) && <TezRateControls />}

      {PROPOSAL_VIEWS.has(status) && list.length === 0 ? (
        <p className={styles.member_empty}>
          No {status} proposals at the moment.
        </p>
      ) : (
        PROPOSAL_VIEWS.has(status) &&
        visible.map((proposal) => (
          <ProposalRow
            key={proposal.id}
            proposal={proposal}
            quorum={quorum}
            aliasOf={aliasOf}
            tokenInfo={tokenInfo}
            tezRate={tezRate}
          />
        ))
      )}

      {PROPOSAL_VIEWS.has(status) && shown < list.length && (
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
