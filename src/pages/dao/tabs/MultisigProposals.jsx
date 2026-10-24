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
  formatTokenAmount,
} from '@utils/multisig-proposals.mjs'
import { useMultisigProposals, useDaoMembers } from '@data/multisig'
import { useTokenInfo } from '@data/token-metadata'
import { TezRateControls, useTezRate } from '@components/dao/TezRate'
import QuorumMeter from '@components/dao/QuorumMeter'
import ProposeAndVote from '@components/dao/ProposeAndVote'
import { voteProposal, executeProposal } from '@data/multisig-actions'
import { useUserStore } from '@context/userStore'
import { formatConverted } from '@data/tez-quote'
import { CoreMembers } from './CoreMembers'
import { DAO_TREASURY_CONTRACT } from '@constants'
import { HashToURL } from '@utils'
import styles from './index.module.scss'

const PAGE = 15

/** The sub-tabs: the proposal states, then acting, then who acts. */
const VIEWS = [
  ...PROPOSAL_STATUSES,
  { key: 'propose', label: 'Propose & vote' },
  { key: 'members', label: 'Core members' },
]

/** Views that list proposals; the others render their own thing. */
const PROPOSAL_VIEWS = new Set(PROPOSAL_STATUSES.map((view) => view.key))

/** Text proposals store an ipfs link to the written proposal. */
function textProposalLink(text) {
  if (!text?.startsWith('ipfs://')) return null
  return HashToURL(text)
}

function ProposalRow({
  proposal,
  quorum,
  aliasOf,
  tokenInfo,
  tezRate,
  viewerVote,
  canAct,
}) {
  const [busy, setBusy] = useState(false)

  async function act(fn) {
    if (busy) return
    setBusy(true)
    try {
      await fn()
    } catch {
      // Already reported by the action layer.
    } finally {
      setBusy(false)
    }
  }

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

      {proposal.status === 'active' && canAct && (
        <div className={styles.proposal_actions}>
          {viewerVote == null ? (
            <>
              <button
                type="button"
                className={styles.act}
                disabled={busy}
                onClick={() => act(() => voteProposal(proposal.id, true))}
              >
                Vote in favour
              </button>
              <button
                type="button"
                className={styles.act}
                disabled={busy}
                onClick={() => act(() => voteProposal(proposal.id, false))}
              >
                Vote against
              </button>
            </>
          ) : (
            <span className={styles.voted}>
              You voted {viewerVote ? 'in favour' : 'against'}
            </span>
          )}
          {proposal.inFavour >= quorum && (
            <button
              type="button"
              className={styles.act}
              disabled={busy}
              onClick={() => act(() => executeProposal(proposal.id))}
            >
              Execute
            </button>
          )}
        </div>
      )}

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
  const address = useUserStore((st) => st.address)

  // The contract rejects a non-member's vote anyway; this only decides
  // whether showing the controls would be a lie.
  const canAct = useMemo(
    () =>
      Boolean(
        address && members.some((m) => m.isCurrent && m.address === address)
      ),
    [address, members]
  )
  const viewerVotes = useMemo(() => {
    const mine = members.find((m) => m.address === address)
    return new Map((mine?.votes ?? []).map((v) => [v.proposalId, v.inFavour]))
  }, [members, address])

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

      {status === 'propose' && (
        <ProposeAndVote
          quorum={quorum}
          memberCount={memberCount}
          expirationDays={expirationDays}
          canAct={canAct}
        />
      )}

      {status === 'members' && <CoreMembers />}

      {status === 'expired' && list.length > 0 && (
        <p className={styles.member_empty}>
          These proposals can no longer be voted on or executed.
        </p>
      )}

      {/* The rate only matters where tez is being moved. */}
      {visible.some((p) => p.rawKind === 'transfer_mutez') && (
        <TezRateControls />
      )}

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
            viewerVote={viewerVotes.get(proposal.id) ?? null}
            canAct={canAct}
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
