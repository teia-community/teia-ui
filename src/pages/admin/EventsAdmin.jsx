// Moderation console tab

import { useState } from 'react'
import classnames from 'classnames'
import { Button } from '@atoms/button'
import { Loading } from '@atoms/loading'
import {
  approveEventProposal,
  rejectEventProposal,
  safeLink,
  screenshotUrl,
  setEventHidden,
  updateEvent,
  useEventProposals,
  useModeratableEvents,
} from '@data/events-chain'
import { useUserProfiles } from '@data/roles'
import EventEditorDialog from '@components/events/EventEditorDialog'
import { walletPreview } from '@utils/string'
import ModerationTable from './ModerationTable'
import styles from '@style'

const PROPOSAL_STATUSES = [
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
]

/**
 * Events (teiaEvents) moderation tab: the community proposal queue
 * (approve / reject) and the live events (edit / hide), switched with a top
 * segment toggle.
 */
export default function EventsAdmin() {
  const [view, setView] = useState('proposals')

  return (
    <div className={styles.tab_body}>
      <div className={styles.segment}>
        {[
          ['proposals', 'Proposals'],
          ['events', 'Live events'],
        ].map(([key, label]) => (
          <button
            key={key}
            type="button"
            className={classnames(styles.segment_btn, {
              [styles.segment_active]: view === key,
            })}
            onClick={() => setView(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {view === 'events' ? <LiveEventsPanel /> : <ProposalsPanel />}
    </div>
  )
}

// Failures are surfaced by the action's own modal.
const quiet = (action) => () => action().catch(() => {})

/** Every on-chain event (hidden included), with edit + hide/unhide. */
function LiveEventsPanel() {
  const { data: events = [], isLoading } = useModeratableEvents(true)
  const { data: profiles = {} } = useUserProfiles([
    ...new Set(events.map((e) => e.proposer).filter(Boolean)),
  ])
  const [editing, setEditing] = useState(null)

  const save = async (draft) => {
    const { eventId } = editing
    // The editor is a top-layer <dialog>: close it so the wallet feedback
    // modal is visible, and reopen it with the draft if the call fails.
    setEditing(null)
    try {
      await updateEvent(eventId, {
        title: draft.title,
        subtitle: draft.subtitle,
        description: draft.description,
        link: draft.link,
        screenshot: draft.screenshot,
        bannerColor: draft.bannerColor,
      })
    } catch {
      setEditing({ ...draft, eventId })
    }
  }

  const proposerLabel = (address) =>
    address ? profiles[address]?.alias || walletPreview(address) : '—'

  const renderRow = (e) => (
    <tr key={e.id} className={e.hidden ? styles.row_hidden : ''}>
      <td className={styles.mono}>#{e.eventId}</td>
      <td className={styles.cell_content}>
        {e.title}
        {e.hidden && <span className={styles.hidden_tag}> (hidden)</span>}
        {e.subtitle && <div className={styles.muted}>{e.subtitle}</div>}
      </td>
      <td>
        <a href={e.link} target="_blank" rel="noreferrer">
          {new URL(e.link).host} ↗
        </a>
      </td>
      <td>{proposerLabel(e.proposer)}</td>
      <td className={styles.row_actions}>
        <Button small shadow_box onClick={() => setEditing(e)}>
          Edit
        </Button>
        <Button
          small
          shadow_box
          onClick={quiet(() =>
            setEventHidden({ eventId: e.eventId, hidden: !e.hidden })
          )}
        >
          {e.hidden ? 'Unhide' : 'Hide'}
        </Button>
      </td>
    </tr>
  )

  return (
    <>
      <h3 className={styles.section_head}>Live events</h3>
      {isLoading ? (
        <Loading message="Loading events…" />
      ) : (
        <ModerationTable
          items={events}
          headers={['Id', 'Title', 'Link', 'Proposer', 'Actions']}
          renderRow={renderRow}
          searchText={(e) =>
            `${e.eventId} ${e.title} ${e.subtitle} ${e.link} ${
              e.proposer ?? ''
            } ${profiles[e.proposer]?.alias ?? ''}`
          }
          emptyLabel="No events match."
        />
      )}
      {editing && (
        <EventEditorDialog
          event={editing}
          onClose={() => setEditing(null)}
          onSave={save}
        />
      )}
    </>
  )
}

/** Community proposals, filterable by status; approve/reject on pending ones. */
function ProposalsPanel() {
  const [status, setStatus] = useState('pending')
  const { data: proposals = [], isLoading } = useEventProposals(true)
  const filtered = proposals.filter((p) => p.status === status)

  const { data: profiles = {} } = useUserProfiles([
    ...new Set(
      proposals.flatMap((p) => [p.proposer, p.resolvedBy].filter(Boolean))
    ),
  ])
  const label = (address) => profiles[address]?.alias || walletPreview(address)

  return (
    <>
      <div className={styles.status_filter}>
        {PROPOSAL_STATUSES.map((s) => (
          <button
            key={s.key}
            type="button"
            className={classnames(styles.status_btn, {
              [styles.status_active]: status === s.key,
            })}
            onClick={() => setStatus(s.key)}
          >
            {s.label}
          </button>
        ))}
      </div>

      <h3 className={styles.section_head}>
        {PROPOSAL_STATUSES.find((s) => s.key === status)?.label} proposals (
        {filtered.length})
      </h3>

      {isLoading ? (
        <Loading message="Loading proposals…" />
      ) : filtered.length > 0 ? (
        filtered.map((p) => (
          <div key={p.id} className={styles.queue_item}>
            <div className={styles.queue_head}>
              <span className={styles.queue_meta}>
                Proposal #{p.id} · proposed by {label(p.proposer)}
                {p.createdAt
                  ? ` on ${new Date(p.createdAt).toLocaleDateString()}`
                  : ''}
                {p.status !== 'pending' && p.resolvedBy && (
                  <>
                    {' · '}
                    {p.status} by {label(p.resolvedBy)}
                    {p.resolvedAt
                      ? ` on ${new Date(p.resolvedAt).toLocaleDateString()}`
                      : ''}
                  </>
                )}
              </span>
              {p.status === 'pending' && (
                <div className={styles.queue_actions}>
                  <Button
                    shadow_box
                    fit
                    onClick={quiet(() => approveEventProposal(p.id))}
                  >
                    Approve
                  </Button>
                  <Button
                    shadow_box
                    fit
                    onClick={quiet(() => rejectEventProposal(p.id))}
                  >
                    Reject
                  </Button>
                </div>
              )}
            </div>
            {/* Full proposed content — moderators see what they approve. */}
            {p.doc ? (
              <ProposedEvent doc={p.doc} />
            ) : (
              <p className={styles.queue_meta}>
                Couldn’t load the proposed content from IPFS (CID:{' '}
                {p.proposedCid}).
              </p>
            )}
          </div>
        ))
      ) : (
        <p className={styles.muted}>No {status} proposals.</p>
      )}
    </>
  )
}

/** The proposed event document, as moderators need to judge it. */
function ProposedEvent({ doc }) {
  const link = safeLink(doc.link)
  const screenshot = screenshotUrl(doc.screenshot)
  return (
    <div className={styles.event_proposal}>
      <div>
        <strong>{doc.title || 'Untitled'}</strong>
        {doc.subtitle && <div className={styles.muted}>{doc.subtitle}</div>}
        {doc.description && <p>{doc.description}</p>}
        {link ? (
          <a href={link} target="_blank" rel="noreferrer">
            {link} ↗
          </a>
        ) : (
          <span className={styles.muted}>
            No valid link — the event would not be shown.
          </span>
        )}
      </div>
      {screenshot && <img src={screenshot} alt="" loading="lazy" />}
    </div>
  )
}
