import { useState } from 'react'
import classnames from 'classnames'
import { Button } from '@atoms/button'
import { Loading } from '@atoms/loading'
import {
  useCalendarProposals,
  useModeratableEvents,
  approveProposal,
  rejectProposal,
  docToDisplayEvent,
} from '@data/calendar-chain'
import { useUserProfiles } from '@data/roles'
import CalendarEventCard from '@components/calendar/CalendarEventCard'
import useChainEventEditor from '@components/calendar/useChainEventEditor'
import styles from '@style'

const PROPOSAL_STATUSES = [
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
]

/**
 * Calendar moderation tab: live on-chain events (edit / hide) and the community
 * proposal queue (approve / reject), switched with a top segment toggle.
 */
export default function CalendarAdmin() {
  const [view, setView] = useState('proposals')

  return (
    <div className={styles.tab_body}>
      <div className={styles.segment}>
        <button
          type="button"
          className={classnames(styles.segment_btn, {
            [styles.segment_active]: view === 'events',
          })}
          onClick={() => setView('events')}
        >
          Events
        </button>
        <button
          type="button"
          className={classnames(styles.segment_btn, {
            [styles.segment_active]: view === 'proposals',
          })}
          onClick={() => setView('proposals')}
        >
          Proposals
        </button>
      </div>

      {view === 'events' ? <EventsPanel /> : <ProposalsPanel />}
    </div>
  )
}

/** Live on-chain events (including hidden), with edit + hide/unhide. */
function EventsPanel() {
  const events = useModeratableEvents(true)
  const { cardHandlers, editorModal, actionError } = useChainEventEditor({
    onMutate: events.mutate,
  })

  return (
    <>
      <h3 className={styles.section_head}>
        Events ({events.data?.length ?? 0})
      </h3>
      {actionError && (
        <p className={styles.muted} role="alert">
          {actionError}
        </p>
      )}

      {events.isLoading ? (
        <Loading message="Loading events…" />
      ) : events.data?.length > 0 ? (
        events.data.map((ev) => (
          <div key={ev.eventId} className={styles.queue_item}>
            <CalendarEventCard event={ev} {...cardHandlers} />
          </div>
        ))
      ) : (
        <p className={styles.muted}>No events yet.</p>
      )}

      {editorModal}
    </>
  )
}

/** Community proposals, filterable by status; approve/reject on pending ones. */
function ProposalsPanel() {
  const [status, setStatus] = useState('pending')
  const {
    data: proposals,
    isLoading,
    mutate: refreshProposals,
  } = useCalendarProposals(true)

  const filtered = (proposals ?? []).filter((p) => p.status === status)

  // Aliases for proposer + resolver addresses shown in the queue.
  const { data: profiles } = useUserProfiles(
    (proposals ?? []).flatMap((p) => [p.proposer, p.resolvedBy].filter(Boolean))
  )
  const label = (address) =>
    address ? profiles?.[address]?.alias || `${address.slice(0, 8)}…` : ''

  const handleApprove = async (id) => {
    try {
      await approveProposal(id)
      refreshProposals()
    } catch {
      // surfaced via modal
    }
  }
  const handleReject = async (id) => {
    try {
      await rejectProposal(id)
      refreshProposals()
    } catch {
      // surfaced via modal
    }
  }

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
                {p.isNewEvent ? 'New event' : `Edit of event #${p.eventId}`} ·
                proposed by {label(p.proposer)}
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
                  <Button shadow_box fit onClick={() => handleApprove(p.id)}>
                    Approve
                  </Button>
                  <Button shadow_box fit onClick={() => handleReject(p.id)}>
                    Reject
                  </Button>
                </div>
              )}
            </div>
            {/* Full proposed content — moderators see what they approve. */}
            {p.doc ? (
              <CalendarEventCard
                event={docToDisplayEvent(p.doc, `proposal-${p.id}`)}
              />
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
