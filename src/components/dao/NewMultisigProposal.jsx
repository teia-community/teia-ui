import { useMemo, useState } from 'react'
import { Button } from '@atoms/button'
import { useTreasuryTokens } from '@data/treasury-tokens'
import {
  proposeTezTransfer,
  proposeTokenTransfer,
  proposeText,
} from '@data/multisig-actions'
import {
  formatTokenAmount,
  toSmallestUnit,
} from '@utils/multisig-proposals.mjs'
import { useTezRate } from './TezRate'
import { formatConverted } from '@data/tez-quote'
import styles from './NewMultisigProposal.module.scss'

const KINDS = [
  { key: 'tez', label: 'Send tez' },
  { key: 'token', label: 'Send a token' },
  { key: 'text', label: 'Written proposal' },
]

const TEZ = { symbol: 'ꜩ', decimals: 6 }
const emptyRow = () => ({ amount: '', destination: '' })

/**
 * Propose something to the core team.
 *
 * Amounts are typed in the token — 3,100 USDt, not 3,100,000,000 — and the
 * figure that will reach the contract is shown underneath, so the conversion
 * is visible rather than something to get wrong in your head.
 */
export function NewMultisigProposal() {
  const [open, setOpen] = useState(false)
  const [kind, setKind] = useState('tez')
  const [rows, setRows] = useState([emptyRow()])
  const [text, setText] = useState('')
  const [tokenKey, setTokenKey] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const { tokens } = useTreasuryTokens()
  const tezRate = useTezRate()

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

  const ready =
    kind === 'text'
      ? text.trim().length > 0
      : parsed.length > 0 &&
        parsed.every((r) => r.raw != null && r.raw > 0 && r.destination) &&
        (kind !== 'token' || Boolean(token)) &&
        !overBalance

  const setRow = (index, patch) =>
    setRows(rows.map((row, i) => (i === index ? { ...row, ...patch } : row)))

  async function submit() {
    if (!ready || submitting) return
    setSubmitting(true)
    try {
      if (kind === 'text') {
        await proposeText(text.trim())
      } else if (kind === 'token') {
        await proposeTokenTransfer(
          token.contract,
          token.tokenId,
          parsed.map((r) => ({ amount: r.raw, destination: r.destination }))
        )
      } else {
        await proposeTezTransfer(
          parsed.map((r) => ({ amount: r.raw, destination: r.destination }))
        )
      }
      setRows([emptyRow()])
      setText('')
      setOpen(false)
    } catch {
      // The action layer has already told the user what went wrong.
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) {
    return (
      <div className={styles.new_bar}>
        <Button shadow_box onClick={() => setOpen(true)}>
          New proposal
        </Button>
      </div>
    )
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

      {kind === 'text' ? (
        <label className={styles.field}>
          <span>Link to the written proposal</span>
          <input
            type="text"
            value={text}
            placeholder="ipfs://…"
            onChange={(e) => setText(e.target.value)}
          />
        </label>
      ) : (
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

          {overBalance && (
            <p className={styles.warn}>
              That is more than the treasury holds (
              {formatTokenAmount(token.rawBalance, token)}).
            </p>
          )}
        </>
      )}

      <div className={styles.actions}>
        <Button shadow_box onClick={submit} disabled={!ready || submitting}>
          {submitting ? 'Submitting…' : 'Submit proposal'}
        </Button>
        <button
          type="button"
          className={styles.cancel}
          onClick={() => setOpen(false)}
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

export default NewMultisigProposal
