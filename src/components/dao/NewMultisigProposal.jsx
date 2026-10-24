import { useMemo, useState } from 'react'
import { Button } from '@atoms/button'
import { useTreasuryTokens } from '@data/treasury-tokens'
import { useDaoMembers } from '@data/multisig'
import { uploadFileToIPFSProxy } from '@data/ipfs'
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
import { HashToURL } from '@utils'
import { TezRateControls, useTezRate } from './TezRate'
import { formatConverted } from '@data/tez-quote'
import styles from './NewMultisigProposal.module.scss'

/**
 * The kinds of proposal, in the order the multisig interface lists them and
 * with the summaries and warnings the core team already reads there.
 */
const KINDS = [
  {
    key: 'tez',
    label: 'Transfer tez',
    summary: 'Transfer tez from the treasury to one or more Tezos addresses.',
  },
  {
    key: 'token',
    label: 'Transfer token',
    summary:
      'Transfer FA2 token editions from the treasury to one or more Tezos addresses.',
  },
  {
    key: 'text',
    label: 'Text',
    summary:
      'Approve a text or decision. No on-chain effect — the text is archived on IPFS and signals an off-chain action.',
  },
  {
    key: 'add',
    label: 'Add user',
    summary: 'Add a new member to the multisig.',
    warning:
      'The minimum vote threshold is not updated, so adding a member makes proposals easier to approve.',
  },
  {
    key: 'remove',
    label: 'Remove user',
    summary: 'Remove one of the current multisig members.',
    warning:
      'The minimum vote threshold is not updated, so removing a member can make proposals harder to approve.',
  },
  {
    key: 'quorum',
    label: 'Minimum votes',
    summary:
      'Change the minimum number of positive votes required to approve proposals.',
    warning:
      'Affects all active proposals at execution. Lowering it may make some immediately executable.',
  },
  {
    key: 'expiry',
    label: 'Expiration time',
    summary: 'Change the proposals expiration time, in days.',
    warning:
      'Affects all active and expired proposals at execution. Raising it can revive expired proposals; lowering it can expire active ones.',
  },
]

const TEZ = { symbol: 'ꜩ', decimals: 6 }
const TRANSFERS = new Set(['tez', 'token'])
const emptyRow = () => ({ amount: '', destination: '' })

/**
 * Raise a proposal with the core team.
 *
 * These are the multisig interface's own proposals, in its order and its
 * words, because the people using it already know that one. What is different
 * is the amount: 3,100 USDt is typed as 3,100, and the figure that reaches
 * the contract is shown beside it.
 */
export function NewMultisigProposal({ quorum, memberCount, expirationDays }) {
  const [kind, setKind] = useState('tez')
  const [rows, setRows] = useState([emptyRow()])
  const [file, setFile] = useState(null)
  const [ipfsPath, setIpfsPath] = useState('')
  const [uploading, setUploading] = useState(false)
  const [tokenKey, setTokenKey] = useState('')
  const [address, setAddress] = useState('')
  const [member, setMember] = useState('')
  const [count, setCount] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const { tokens } = useTreasuryTokens()
  const { members } = useDaoMembers()
  const tezRate = useTezRate()

  const option = KINDS.find((k) => k.key === kind)
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
  const typedAny = rows.some((row) => row.amount.trim() !== '')
  const overBalance =
    kind === 'token' && token ? total > token.rawBalance : false

  // A count has to be a whole number: half a vote is not a thing.
  const whole = /^\d+$/.test(count.trim()) ? Number(count.trim()) : null

  const ready = (() => {
    switch (kind) {
      case 'text':
        return ipfsPath !== ''
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
          parsed.every(
            (r) => r.raw != null && r.raw > 0 && validAddress(r.destination)
          ) &&
          (kind !== 'token' || Boolean(token)) &&
          !overBalance
        )
    }
  })()

  const setRow = (index, patch) =>
    setRows(rows.map((row, i) => (i === index ? { ...row, ...patch } : row)))

  async function upload() {
    if (!file || uploading) return
    setUploading(true)
    try {
      const cid = await uploadFileToIPFSProxy(
        { path: file.name, blob: file, size: file.size },
        'Text proposal'
      )
      if (cid) setIpfsPath(cid)
    } catch {
      // The upload reports its own failure through the modal.
    } finally {
      setUploading(false)
    }
  }

  async function submit() {
    if (!ready || submitting) return
    setSubmitting(true)
    try {
      if (kind === 'text') {
        await proposeText(`ipfs://${ipfsPath}`)
        setFile(null)
        setIpfsPath('')
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
    } catch {
      // The action layer has already told the user what went wrong.
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className={styles.form}>
      <div className={styles.kinds}>
        {KINDS.map((o) => (
          <button
            type="button"
            key={o.key}
            className={`${styles.kind} ${
              kind === o.key ? styles.kind_active : ''
            }`}
            onClick={() => setKind(o.key)}
          >
            {o.label}
          </button>
        ))}
      </div>

      <p className={styles.summary}>{option.summary}</p>
      {option.warning && <p className={styles.caution}>{option.warning}</p>}

      <div className={styles.fields}>
        {kind === 'token' && (
          <label className={styles.field}>
            <span className={styles.label}>Token</span>
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
          <>
            <label className={styles.field}>
              <span className={styles.label}>
                File with the text to approve
              </span>
              <input
                type="file"
                onChange={(e) => {
                  setFile(e.target.files?.[0] ?? null)
                  setIpfsPath('')
                }}
              />
            </label>
            {file && (
              <div className={styles.field}>
                <button
                  type="button"
                  className={styles.act}
                  disabled={uploading || ipfsPath !== ''}
                  onClick={upload}
                >
                  {ipfsPath
                    ? 'uploaded'
                    : uploading
                    ? 'uploading…'
                    : 'upload to IPFS'}
                </button>
                {ipfsPath && (
                  <a
                    href={HashToURL(`ipfs://${ipfsPath}`)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {ipfsPath}
                  </a>
                )}
              </div>
            )}
          </>
        )}

        {kind === 'add' && (
          <>
            <label className={styles.field}>
              <span className={styles.label}>
                Address to add — a Tezos wallet (tz1…)
              </span>
              <input
                type="text"
                className={styles.wide}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </label>
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
            <span className={styles.label}>Member to remove</span>
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
              <span className={styles.label}>
                {kind === 'quorum'
                  ? `Votes in favour, now ${quorum} of ${memberCount}`
                  : `Days, now ${expirationDays}`}
              </span>
              <input
                type="text"
                inputMode="numeric"
                value={count}
                onChange={(e) => setCount(e.target.value)}
              />
            </label>
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

        {TRANSFERS.has(kind) &&
          rows.map((row, index) => {
            const entry = parsed[index]
            const invalid = row.amount.trim() !== '' && entry.raw == null
            return (
              <fieldset className={styles.destination} key={index}>
                <legend>
                  Destination {index + 1}
                  {rows.length > 1 && (
                    <button
                      type="button"
                      className={styles.link}
                      onClick={() =>
                        setRows(rows.filter((_, i) => i !== index))
                      }
                    >
                      remove
                    </button>
                  )}
                </legend>
                <label className={styles.field}>
                  <span className={styles.label}>Amount</span>
                  <span className={styles.with_unit}>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={row.amount}
                      onChange={(e) =>
                        setRow(index, { amount: e.target.value })
                      }
                    />
                    {/* The unit is unknown until a token is chosen. */}
                    {(kind !== 'token' || token) && (
                      <small>{unit.symbol}</small>
                    )}
                  </span>
                </label>
                <label className={styles.field}>
                  <span className={styles.label}>
                    To — a Tezos address, a wallet (tz1…) or a contract (KT1…)
                  </span>
                  <input
                    type="text"
                    className={styles.wide}
                    value={row.destination}
                    onChange={(e) =>
                      setRow(index, { destination: e.target.value })
                    }
                  />
                </label>
                {entry.destination !== '' &&
                  !validAddress(entry.destination) && (
                    <p className={styles.warn}>That is not a Tezos address.</p>
                  )}
                {invalid && (
                  <p className={styles.warn}>
                    That amount cannot be sent exactly. Use a plain number.
                  </p>
                )}
              </fieldset>
            )
          })}
      </div>

      {TRANSFERS.has(kind) && (
        <>
          <button
            type="button"
            className={styles.link}
            onClick={() => setRows([...rows, emptyRow()])}
          >
            Add another destination
          </button>

          {/* Nothing typed yet is a blank budget, not a transfer of zero. */}
          {typedAny && (
            <p className={styles.total}>
              {kind === 'token' ? (
                token ? (
                  <>
                    Sends {formatTokenAmount(total, token)} in total
                    <small>
                      {' '}
                      — {total.toLocaleString()} base units on-chain
                    </small>
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
          )}

          {/* Only tez needs a rate: a stablecoin is already money. */}
          {kind === 'tez' && typedAny && <TezRateControls />}

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
          {submitting ? 'Submitting…' : 'Send proposal'}
        </Button>
      </div>
    </div>
  )
}

export default NewMultisigProposal
