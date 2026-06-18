import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useUserStore } from '@context/userStore'
import { useMultisigUsers, useUserProfiles } from '@data/roles'
import {
  useModeratorSet,
  useModeratorProposals,
  useModeratorVotes,
  useMultisigExpiration,
  proposeAddModerator,
  proposeRemoveModerator,
  voteModeratorProposal,
  executeModeratorProposal,
} from '@data/moderators'
import Button from '@atoms/button/Button'
import { Input } from '@atoms/input'
import { Line } from '@atoms/line'
import { Identicon } from '@atoms/identicons'
import { walletPreview } from '@utils/string'
import { validAddress } from '@utils/collab'
import styles from '@style'

const ACTION_LABELS = {
  add_moderator: 'Add moderator',
  remove_moderator: 'Remove moderator',
  update_multisig_address: 'Update multisig address',
  update_metadata: 'Update metadata',
}

function Account({ address, profile }) {
  return (
    <Link to={`/tz/${address}`} className={styles.account} title={address}>
      <Identicon
        address={address}
        logo={profile?.logo}
        className={styles.avatar}
      />
      <span>{profile?.alias || walletPreview(address)}</span>
    </Link>
  )
}

/** Human readable remaining time before a proposal expires. */
function expiryLabel(timestamp, expirationDays) {
  if (!expirationDays) return null
  const expires = new Date(timestamp).getTime() + expirationDays * 86_400_000
  const diff = expires - Date.now()
  if (diff <= 0) return 'Expired'
  const days = Math.floor(diff / 86_400_000)
  const hours = Math.floor((diff % 86_400_000) / 3_600_000)
  return days > 0 ? `${days}d ${hours}h left` : `${hours}h left`
}

/**
 * Manage the moderator set of a moderator contract (add / remove via the
 * multisig propose → vote → execute flow)
 */
export default function ModeratorManagement({
  contract,
  multisig,
  title = 'Moderators',
}) {
  const address = useUserStore((st) => st.address)
  const { data: multisigUsers } = useMultisigUsers()
  const { data: moderators } = useModeratorSet(contract)
  const { data: proposals } = useModeratorProposals(contract)
  const { data: votes } = useModeratorVotes(contract)
  const { data: expirationDays } = useMultisigExpiration(multisig)

  const canManage = Boolean(address && multisigUsers?.includes(address))

  const displayModerators = moderators ?? []
  const allProposals = proposals ?? []

  // SWR v1 has no `isLoading`; data is `undefined` until the first response.
  const loadingMods = moderators === undefined
  const loadingProps = proposals === undefined

  const [newAddress, setNewAddress] = useState('')
  const [busy, setBusy] = useState(false)

  const openProposals = allProposals.filter((p) => !p.executed)
  const executedProposals = allProposals.filter((p) => p.executed)

  // Resolve alias + avatar for every address shown (moderators, proposal
  // targets and issuers) in one batched request.
  const { data: profiles = {} } = useUserProfiles([
    ...displayModerators,
    ...allProposals.flatMap((p) => [p.address, p.issuer]),
  ])

  const run = async (fn) => {
    setBusy(true)
    try {
      await fn()
    } catch {
      /* errors are surfaced through the modal */
    } finally {
      setBusy(false)
    }
  }

  const trimmed = newAddress.trim()
  const isValidNew = validAddress(trimmed)
  const alreadyModerator = displayModerators.includes(trimmed)

  const handleAdd = () =>
    run(async () => {
      await proposeAddModerator(contract, trimmed)
      setNewAddress('')
    })

  // -- vote / count helpers --
  const noVotesFor = (id) =>
    (votes ?? []).filter((v) => v.proposalId === id && !v.approval).length
  const myVoteOn = (id) =>
    (votes ?? []).find((v) => v.proposalId === id && v.voter === address)
      ?.approval ?? null

  return (
    <section className={styles.section}>
      <h1 className={styles.section_title}>{title}</h1>
      <p>
        Moderators are managed through the DAO multisig. Anyone can review the
        current moderators and open proposals; submitting, voting and executing
        proposals is restricted on-chain to DAO multisig members.
      </p>

      {!canManage && (
        <p className={styles.notice}>
          {address
            ? 'Your wallet is not a DAO multisig member, so you can view but not change the moderator set.'
            : 'Connect a DAO multisig wallet to propose, vote on, or execute changes.'}
        </p>
      )}

      <Line className={styles.divider} />

      <div className={styles.columns}>
        <div className={styles.column}>
          <h2 className={styles.subtitle}>Current moderators</h2>
          {loadingMods ? (
            <p>Loading…</p>
          ) : displayModerators.length ? (
            <ul className={styles.list}>
              {displayModerators.map((addr) => (
                <li key={addr} className={styles.row}>
                  <Account address={addr} profile={profiles[addr]} />
                  {canManage && (
                    <div className={styles.row_action}>
                      <Button
                        fit
                        shadow_box
                        disabled={busy}
                        onClick={() =>
                          run(() => proposeRemoveModerator(contract, addr))
                        }
                      >
                        Propose removal
                      </Button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p>No moderators yet.</p>
          )}
        </div>

        {canManage && (
          <div className={styles.column}>
            <h2 className={styles.subtitle}>Add a moderator</h2>
            <div className={styles.add_form}>
              <Input
                type="text"
                name="moderator_address"
                placeholder="tz1… or KT1… address"
                value={newAddress}
                onChange={(v) => setNewAddress(String(v))}
              />
              <Button
                fit
                shadow_box
                disabled={busy || !isValidNew || alreadyModerator}
                onClick={handleAdd}
              >
                Propose addition
              </Button>
            </div>
            {trimmed.length > 0 && !isValidNew && (
              <p className={styles.error}>Enter a valid Tezos address.</p>
            )}
            {alreadyModerator && (
              <p className={styles.error}>
                This address is already a moderator.
              </p>
            )}
          </div>
        )}
      </div>

      <Line className={styles.divider} />
      <h2 className={styles.subtitle}>Open proposals</h2>
      {loadingProps ? (
        <p>Loading…</p>
      ) : openProposals.length ? (
        <ul className={styles.list}>
          {openProposals.map((p) => {
            const myVote = myVoteOn(p.id)
            const noVotes = noVotesFor(p.id)
            const executable = p.positiveVotes >= p.minimumVotes
            const expiry = expiryLabel(p.timestamp, expirationDays)
            return (
              <li key={p.id} className={styles.proposal}>
                <div className={styles.proposal_title}>
                  <span className={styles.proposal_id}>#{p.id}</span>
                  <span className={styles.proposal_action}>
                    {ACTION_LABELS[p.action] ?? p.action}
                  </span>
                  {p.address && (
                    <Account
                      address={p.address}
                      profile={profiles[p.address]}
                    />
                  )}
                </div>

                <dl className={styles.proposal_meta}>
                  <div className={styles.meta_row}>
                    <dt>Votes</dt>
                    <dd>
                      ✅ {p.positiveVotes} &nbsp;·&nbsp; ❌ {noVotes}
                      <span className={styles.meta_hint}>
                        {' '}
                        (min {p.minimumVotes} to execute)
                      </span>
                    </dd>
                  </div>
                  <div className={styles.meta_row}>
                    <dt>Status</dt>
                    <dd>
                      <span
                        className={
                          executable ? styles.badge_ready : styles.badge_pending
                        }
                      >
                        {executable ? 'Ready to execute' : 'Awaiting votes'}
                      </span>
                      {expiry && (
                        <span className={styles.meta_hint}> · {expiry}</span>
                      )}
                    </dd>
                  </div>
                  <div className={styles.meta_row}>
                    <dt>Issuer</dt>
                    <dd>
                      <Account
                        address={p.issuer}
                        profile={profiles[p.issuer]}
                      />
                    </dd>
                  </div>
                  <div className={styles.meta_row}>
                    <dt>Your vote</dt>
                    <dd>
                      {myVote === true
                        ? '✅ Yes'
                        : myVote === false
                        ? '❌ No'
                        : '—'}
                    </dd>
                  </div>
                </dl>

                {canManage && (
                  <div className={styles.proposal_buttons}>
                    <div className={styles.action_btn}>
                      <Button
                        fit
                        shadow_box
                        disabled={busy}
                        onClick={() =>
                          run(() => voteModeratorProposal(contract, p.id, true))
                        }
                      >
                        Vote yes
                      </Button>
                    </div>
                    <div className={styles.action_btn}>
                      <Button
                        fit
                        shadow_box
                        disabled={busy}
                        onClick={() =>
                          run(() =>
                            voteModeratorProposal(contract, p.id, false)
                          )
                        }
                      >
                        Vote no
                      </Button>
                    </div>
                    {executable && (
                      <div className={styles.action_btn}>
                        <Button
                          fit
                          shadow_box
                          disabled={busy}
                          onClick={() =>
                            run(() => executeModeratorProposal(contract, p.id))
                          }
                        >
                          Execute
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      ) : (
        <p>No open proposals.</p>
      )}

      {executedProposals.length > 0 && (
        <>
          <Line className={styles.divider} />
          <h2 className={styles.subtitle}>Executed proposals</h2>
          <ul className={styles.list}>
            {executedProposals.map((p) => (
              <li key={p.id} className={styles.row}>
                <span className={styles.proposal_head}>
                  <b>#{p.id}</b> — {ACTION_LABELS[p.action] ?? p.action}
                  {p.address && (
                    <>
                      {' · '}
                      <Account
                        address={p.address}
                        profile={profiles[p.address]}
                      />
                    </>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  )
}
