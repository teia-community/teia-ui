import { useMemo, useState } from 'react'
import { useTreasuryTokens } from '@data/treasury-tokens'
import { useDaoMembers } from '@data/multisig'
import {
  proposeTezTransfer,
  proposeTokenTransfer,
  proposeText,
  proposeAddUser,
  proposeRemoveUser,
  proposeMinimumVotes,
  proposeExpirationTime,
} from '@data/multisig-actions'
import {
  formatTokenAmount,
  toSmallestUnit,
} from '@utils/multisig-proposals.mjs'
import { validAddress } from '@utils/collab'
import { walletPreview } from '@utils/string'
import { TezRateControls, useTezRate } from './TezRate'
import { formatConverted } from '@data/tez-quote'
import styles from './NewMultisigProposal.module.scss'

const KINDS = [
  { key: 'tez', label: 'Send tez' },
  { key: 'token', label: 'Send a token' },
  { key: 'text', label: 'Written proposal' },
  { key: 'add', label: 'Add a member' },
  { key: 'remove', label: 'Remove a member' },
  { key: 'quorum', label: 'Votes needed' },
  { key: 'expiry', label: 'Time to vote' },
]

const TEZ = { symbol: 'ꜩ', decimals: 6 }
const TRANSFERS = new Set(['tez', 'token'])
const emptyRow = () => ({ amount: '', destination: '' })

/**
 * Propose something to the core team.
 *
 * Everything the multisig can be asked to do is here, so that raising a
 * proposal is one place rather than one per kind. Amounts are typed in the
 * token — 3,100 USDt, not 3,100,000,000 — and the figure that will reach the
 * contract is shown underneath, so the conversion is visible rather than
 * something to get wrong in your head.
 */
export function NewMultisigProposal({ quorum, memberCount, expirationDays }) {
  const [kind, setKind] = useState('tez')
  const [rows, setRows] = useState([emptyRow()])
  const [text, setText] = useState('')
  const [tokenKey, setTokenKey] = useState('')
  const [address, setAddress] = useState('')
  const [member, setMember] = useState('')
  const [count, setCount] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const { tokens } = useTreasuryTokens()
  const { members } = useDaoMembers()
  const tezRate = useTezRate()

  const current = useMemo(() => members.filter((m) => m.isCurrent), [members])

  const token = useMemo(
    () => tokens.find((t) => `${t.contract}:${t.tokenId}` === tokenKey),
    [tokens, tokenKey]
  )
  const unit = kind === 'token' ? token ?? TEZ : TEZ

  // What each row becomes on-chain, and whether it can be sent at all.
  const parsed = useMemo(
    () =>
      rows.map((row) => ({
        raw: toSmallestUnit(row.amount, unit.decimals),
        destination: row.destination.trim(),
      })),
    [rows, unit.decimals]
  )

  const total = parsed.reduce((sum, r) => sum + (r.raw ?? 0), 0)
  const overBalance =
    kind === 'token' && token ? total > token.rawBalance : false

  // A count has to be a whole number: half a vote is not a thing.
  const whole = /^\d+$/.test(count.trim()) ? Number(count.trim()) : null

  const ready = (() => {
    switch (kind) {
      case 'text':
        return text.trim().length > 0
      case 'add':
        return (
          validAddress(address.trim()) &&
          !current.some((m) => m.address === address.trim())
        )
      case 'remove':
        return Boolean(member)
      case 'quorum':
        return (
          whole != null && whole > 0 && whole <= memberCount && whole !== quorum
        )
      case 'expiry':
        return whole != null && whole > 0 && whole !== expirationDays
      default:
        return (
          parsed.length > 0 &&
          parsed.every((r) => r.raw != null && r.raw > 0 && r.destination) &&
          (kind !== 'token' || Boolean(token)) &&
          !overBalance
        )
    }
  })()

  const setRow = (index, patch) =>
    setRows(rows.map((row, i) => (i === index ? { ...row, ...patch } : row)))

  async function submit() {
    if (!ready || submitting) return
    setSubmitting(true)
    try {
      if (kind === 'text') {
        await proposeText(text.trim())
      } else if (kind === 'add') {
        await proposeAddUser(address.trim())
        setAddress('')
      } else if (kind === 'remove') {
        await proposeRemoveUser(member)
        setMember('')
      } else if (kind === 'quorum') {
        await proposeMinimumVotes(whole)
        setCount('')
      } else if (kind === 'expiry') {
        await proposeExpirationTime(whole)
        setCount('')
      } else if (kind === 'token') {
        await proposeTokenTransfer(
          token.contract,
          token.tokenId,
          parsed.map((r) => ({ amount: r.raw, destination: r.destination }))
        )
        setRows([emptyRow()])
      } else {
        await proposeTezTransfer(
          parsed.map((r) => ({ amount: r.raw, destination: r.destination }))
        )
        setRows([emptyRow()])
      }
      setText('')
    } catch {
      // The action layer has already told the user what went wrong.
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className={styles.form}>
      <div className={styles.kinds}>
        {KINDS.map((option) => (
          <button
            type="button"
            key={option.key}
            className={`${styles.kind} ${
              kind === option.key ? styles.kind_active : ''
            }`}
            onClick={() => setKind(option.key)}
          >
            {option.label}
          </button>
        ))}
      </div>

      {kind === 'token' && (
        <label className={styles.field}>
          <span>Token</span>
          <select
            value={tokenKey}
            onChange={(e) => setTokenKey(e.target.value)}
          >
            <option value="">Choose a token the treasury holds</option>
            {tokens.map((t) => (
              <option
                key={`${t.contract}:${t.tokenId}`}
                value={`${t.contract}:${t.tokenId}`}
              >
                {t.symbol} — {formatTokenAmount(t.rawBalance, t)} available
              </option>
            ))}
          </select>
        </label>
      )}

      {kind === 'text' && (
        <label className={styles.field}>
          <span>Link to the written proposal</span>
          <input
            type="text"
            value={text}
            placeholder="ipfs://…"
            onChange={(e) => setText(e.target.value)}
          />
        </label>
      )}

      {kind === 'add' && (
        <>
          <label className={styles.field_wide}>
            <span>Address to add</span>
            <input
              type="text"
              value={address}
              placeholder="tz1…"
              onChange={(e) => setAddress(e.target.value)}
            />
          </label>
          <p className={styles.summary}>
            They join once the proposal is executed and they accept the
            membership.
          </p>
          {address.trim() !== '' && !validAddress(address.trim()) && (
            <p className={styles.warn}>That is not a Tezos address.</p>
          )}
          {current.some((m) => m.address === address.trim()) && (
            <p className={styles.warn}>They are already on the core team.</p>
          )}
        </>
      )}

      {kind === 'remove' && (
        <label className={styles.field}>
          <span>Member to remove</span>
          <select value={member} onChange={(e) => setMember(e.target.value)}>
            <option value="">Choose a member</option>
            {current.map((m) => (
              <option key={m.address} value={m.address}>
                {m.alias || walletPreview(m.address)}
              </option>
            ))}
          </select>
        </label>
      )}

      {(kind === 'quorum' || kind === 'expiry') && (
        <>
          <label className={styles.field}>
            <span>{kind === 'quorum' ? 'Votes in favour' : 'Days'}</span>
            <input
              type="text"
              inputMode="numeric"
              value={count}
              placeholder={String(
                kind === 'quorum' ? quorum ?? '' : expirationDays ?? ''
              )}
              onChange={(e) => setCount(e.target.value)}
            />
          </label>
          <p className={styles.summary}>
            {kind === 'quorum'
              ? `A proposal now needs ${quorum} of ${memberCount} members in favour.`
              : `A proposal now expires ${expirationDays} days after it is raised.`}
          </p>
          {count.trim() !== '' && whole == null && (
            <p className={styles.warn}>Use a whole number.</p>
          )}
          {kind === 'quorum' && whole > memberCount && (
            <p className={styles.warn}>
              The core team only has {memberCount} members.
            </p>
          )}
        </>
      )}

      {TRANSFERS.has(kind) && (
        <>
          {rows.map((row, index) => {
            const entry = parsed[index]
            const invalid = row.amount.trim() !== '' && entry.raw == null
            return (
              <div className={styles.row} key={index}>
                <label className={styles.field}>
                  <span>Amount</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={row.amount}
                    placeholder={kind === 'token' ? '3100' : '100'}
                    onChange={(e) => setRow(index, { amount: e.target.value })}
                  />
                  <small>{unit.symbol}</small>
                </label>
                <label className={styles.field_wide}>
                  <span>To</span>
                  <input
                    type="text"
                    value={row.destination}
                    placeholder="tz1…"
                    onChange={(e) =>
                      setRow(index, { destination: e.target.value })
                    }
                  />
                </label>
                {rows.length > 1 && (
                  <button
                    type="button"
                    className={styles.remove}
                    onClick={() => setRows(rows.filter((_, i) => i !== index))}
                  >
                    Remove
                  </button>
                )}
                {invalid && (
                  <p className={styles.warn}>
                    That amount cannot be sent exactly. Use a plain number.
                  </p>
                )}
              </div>
            )
          })}

          <button
            type="button"
            className={styles.add}
            onClick={() => setRows([...rows, emptyRow()])}
          >
            Add another destination
          </button>

          <p className={styles.summary}>
            {kind === 'token' ? (
              token ? (
                <>
                  Sends {formatTokenAmount(total, token)} in total
                  <small> — {total.toLocaleString()} base units on-chain</small>
                </>
              ) : (
                'Choose a token to continue.'
              )
            ) : (
              <>
                Sends {formatTokenAmount(total, TEZ)} in total
                {tezRate.rate != null && (
                  <small>
                    {' '}
                    ≈{' '}
                    {formatConverted(
                      total / 1000000,
                      tezRate.rate,
                      tezRate.currency
                    )}
                  </small>
                )}
              </>
            )}
          </p>

          {/* Only tez needs a rate: a stablecoin is already money. */}
          {kind === 'tez' && <TezRateControls />}

          {overBalance && (
            <p className={styles.warn}>
              That is more than the treasury holds (
              {formatTokenAmount(token.rawBalance, token)}).
            </p>
          )}
        </>
      )}

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.submit}
          onClick={submit}
          disabled={!ready || submitting}
        >
          {submitting ? 'Submitting…' : 'Submit proposal'}
        </button>
      </div>
    </div>
  )
}

export default NewMultisigProposal
