import { useState } from 'react'
import { TezosAddressLink } from '@atoms/link'
import { Loading } from '@atoms/loading'
import { useUserStore } from '@context/userStore'
import { useTeiaFees } from '@data/teia-fees'
import {
  useFeeProposals,
  proposeFeeChange,
  voteFeeProposal,
  executeFeeProposal,
} from '@data/fee-governance'
import { feeSetter, feeField } from '@utils/fee-governance.mjs'
import {
  formatTokenAmount,
  toSmallestUnit,
} from '@utils/multisig-proposals.mjs'
import { walletPreview } from '@utils/string'
import { getWordDate } from '@utils/time'
import QuorumMeter from './QuorumMeter'
import styles from './FeeGovernance.module.scss'

const TEZ = { symbol: 'ꜩ', decimals: 6 }
const tez = (mutez) => formatTokenAmount(mutez, TEZ)

/** The row for one fee: what it is now, and a way to propose something else. */
function FeeRow({ fee, canAct, onPropose }) {
  const [draft, setDraft] = useState(null)
  const [busy, setBusy] = useState(false)

  const mutez = draft == null ? null : toSmallestUnit(draft, 6)
  const invalid = draft != null && draft.trim() !== '' && mutez == null
  // A fee of nothing is a real choice, so zero is allowed -- but an amount
  // that merely rounds to nothing is not what anyone meant to type.
  const tooSmall = mutez === 0 && parseFloat(draft) > 0
  const unchanged = mutez != null && mutez === fee.value

  async function submit() {
    setBusy(true)
    try {
      await onPropose(feeSetter(fee.field), mutez)
      setDraft(null)
    } catch {
      // The action layer has already told the user what went wrong.
    } finally {
      setBusy(false)
    }
  }

  return (
    <li className={styles.fee}>
      <div className={styles.fee_head}>
        <span>{fee.label}</span>
        <span className={styles.fee_value}>
          {fee.value == null ? '—' : tez(fee.value)}
        </span>
        {canAct &&
          (draft == null ? (
            <button
              type="button"
              className={styles.link}
              onClick={() => setDraft('')}
            >
              Propose a change
            </button>
          ) : (
            <button
              type="button"
              className={styles.link}
              onClick={() => setDraft(null)}
            >
              Cancel
            </button>
          ))}
      </div>

      {draft != null && (
        <div className={styles.fee_form}>
          <input
            type="text"
            inputMode="decimal"
            value={draft}
            placeholder="0.025"
            aria-label={`New ${fee.label.toLowerCase()} fee, in tez`}
            onChange={(e) => setDraft(e.target.value)}
          />
          <span className={styles.unit}>{TEZ.symbol}</span>
          {mutez != null && !tooSmall && (
            <small className={styles.hint}>
              = {mutez.toLocaleString()} mutez on-chain
            </small>
          )}
          {tooSmall && (
            <small className={styles.warn}>
              Tez goes down to a millionth. The smallest fee is 0.000001 ꜩ.
            </small>
          )}
          {invalid && (
            <small className={styles.warn}>
              That amount cannot be set exactly. Use a plain number.
            </small>
          )}
          {unchanged && (
            <small className={styles.hint}>
              That is what the contract already charges.
            </small>
          )}
          <button
            type="button"
            className={styles.act}
            disabled={busy || mutez == null || unchanged || tooSmall}
            onClick={submit}
          >
            {busy ? 'Submitting…' : 'Propose'}
          </button>
        </div>
      )}
    </li>
  )
}

/** One fee proposal waiting for the core team, or one already carried out. */
function ProposalRow({ proposal, quorum, canAct, labelOf }) {
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

  return (
    <div className={styles.proposal}>
      <div className={styles.proposal_head}>
        <span className={styles.proposal_where}>{proposal.contractName}</span>
        <span className={styles.proposal_what}>
          {labelOf(proposal)} → {tez(proposal.value)}
        </span>
        <span className={styles.proposal_when}>
          {getWordDate(proposal.timestamp)}
        </span>
      </div>

      <div className={styles.proposal_body}>
        {!proposal.executed && (
          <QuorumMeter inFavour={proposal.positiveVotes} quorum={quorum} />
        )}
        <span className={styles.against}>{proposal.negativeVotes} against</span>
        <span className={styles.issuer}>
          proposed by {walletPreview(proposal.issuer)}
        </span>
      </div>

      {!proposal.executed && canAct && (
        <div className={styles.proposal_actions}>
          {proposal.myVote == null ? (
            <>
              <button
                type="button"
                className={styles.act}
                disabled={busy}
                onClick={() => act(() => voteFeeProposal(proposal, true))}
              >
                Vote in favour
              </button>
              <button
                type="button"
                className={styles.act}
                disabled={busy}
                onClick={() => act(() => voteFeeProposal(proposal, false))}
              >
                Vote against
              </button>
            </>
          ) : (
            <span className={styles.voted}>
              You voted {proposal.myVote ? 'in favour' : 'against'}
            </span>
          )}
          {proposal.positiveVotes >= quorum && (
            <button
              type="button"
              className={styles.act}
              disabled={busy}
              onClick={() => act(() => executeFeeProposal(proposal))}
            >
              Execute
            </button>
          )}
        </div>
      )}
    </div>
  )
}

/**
 * Fee changes.
 *
 * A fee change is not a treasury proposal: it is proposed, voted on and
 * carried out inside the contract that charges the fee, by the same core team
 * and against the same quorum. This brings all of that here, next to the
 * treasury proposals, so there is one place to vote.
 */
export default function FeeGovernance({ quorum, canAct }) {
  const address = useUserStore((st) => st.address)
  const { groups, isLoading } = useTeiaFees()
  const { proposals, error } = useFeeProposals(address)

  const votable = groups.filter((group) => group.gov)

  /** Name the fee a proposal would change, from the contract it sits in. */
  const labelOf = (proposal) => {
    const field = feeField(proposal.entrypoint)
    const group = groups.find((g) => g.key === proposal.contractKey)
    return group?.fees.find((f) => f.field === field)?.label ?? field
  }

  const open = proposals.filter((p) => !p.executed)
  const past = proposals.filter((p) => p.executed)

  return (
    <div className={styles.wrap}>
      <p className={styles.intro}>
        Each contract that charges a fee holds its own vote on that fee:
        proposing a new amount opens a proposal inside the contract, which the
        core team then votes on and executes, needing the same {quorum} votes as
        a treasury proposal. The marketplace commission is the exception — the
        multisig is its manager, so it changes through a treasury proposal
        instead.
      </p>

      {error && (
        <p className={styles.empty}>
          Error loading fee proposals: {error.message}
        </p>
      )}

      <h2 className={styles.heading}>
        Open <small>{open.length}</small>
      </h2>
      {open.length === 0 ? (
        <p className={styles.empty}>No fee changes are up for a vote.</p>
      ) : (
        open.map((proposal) => (
          <ProposalRow
            key={proposal.key}
            proposal={proposal}
            quorum={quorum}
            canAct={canAct}
            labelOf={labelOf}
          />
        ))
      )}

      {past.length > 0 && (
        <>
          <h2 className={styles.heading}>
            Carried out <small>{past.length}</small>
          </h2>
          {past.map((proposal) => (
            <ProposalRow
              key={proposal.key}
              proposal={proposal}
              quorum={quorum}
              canAct={false}
              labelOf={labelOf}
            />
          ))}
        </>
      )}

      <h2 className={styles.heading}>Fees that change this way</h2>
      {isLoading && <Loading message="Reading fees from the contracts" />}
      {votable.map((group) => (
        <section key={group.key} className={styles.group}>
          <h3 className={styles.group_name}>
            {group.name}
            <small>
              <TezosAddressLink address={group.address} shorten />
            </small>
          </h3>
          <ul className={styles.fees}>
            {group.fees.map((fee) => (
              <FeeRow
                key={fee.field}
                fee={fee}
                canAct={canAct}
                onPropose={(entrypoint, mutez) =>
                  proposeFeeChange(group.address, entrypoint, mutez)
                }
              />
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
