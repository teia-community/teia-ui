import { useEffect, useMemo, useState } from 'react'
import useClipboard from 'react-use-clipboard'
import { Page } from '@atoms/layout'
import { Button } from '@atoms/button'
import { Loading } from '@atoms/loading'
import { useCalendarEvents } from '@hooks/use-calendar'
import { useCalendarRoles } from '@data/calendar-chain'
import useChainEventEditor from '@components/calendar/useChainEventEditor'
import MonthGrid from '@components/calendar/MonthGrid'
import styles from '@style'

/**
 * Calendar page — community events live on the teiaCalendar contract:
 *  - moderators / multisig create/edit/hide directly + approve/reject proposals;
 *  - TEIA holders propose new events and edits;
 *  - everyone else views + subscribes, and gets a "get TEIA" prompt.
 * WordPress events are merged in read-only.
 */
const SHOW_TTC_KEY = 'calendar:showTtc'

export default function Calendar() {
  const { events: allEvents, isLoading, error } = useCalendarEvents()

  // Toggle for thetezos.com (TTC) events.
  const [showTtc, setShowTtc] = useState(() => {
    if (typeof window === 'undefined') return true
    return window.localStorage.getItem(SHOW_TTC_KEY) !== '0'
  })
  useEffect(() => {
    window.localStorage.setItem(SHOW_TTC_KEY, showTtc ? '1' : '0')
  }, [showTtc])

  const events = useMemo(
    () => (showTtc ? allEvents : allEvents.filter((e) => e.source !== 'wp')),
    [allEvents, showTtc]
  )

  const { canModerate } = useCalendarRoles()

  // Feed URL for the Subscribe block (served at /calendar.ics — see netlify.toml).
  const ICS_URL =
    import.meta.env.VITE_CALENDAR_ICS_URL ||
    (typeof window !== 'undefined'
      ? `${window.location.origin}/calendar.ics`
      : '')
  const webcal = ICS_URL.replace(/^https?:\/\//, 'webcal://')
  // Google Calendar, webcal handler
  const googleCal = `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(
    ICS_URL
  )}`
  const [copied, copy] = useClipboard(ICS_URL)

  // Create/edit/hide flow (form modal + moderator actions) lives in the hook,
  // shared with the moderation console.
  const {
    cardHandlers,
    startCreate,
    opening,
    actionError,
    isEditing,
    editorModal,
  } = useChainEventEditor()

  return (
    <Page title="Teia Calendar">
      <div className={styles.container}>
        <header className={styles.header}>
          <h1 className={styles.headline}>Calendar</h1>
          <div className={styles.header_actions}>
            <button
              type="button"
              className={`${styles.ttc_toggle} ${
                showTtc ? styles.ttc_toggle_on : ''
              }`}
              aria-pressed={showTtc}
              onClick={() => setShowTtc((v) => !v)}
              title={
                showTtc
                  ? 'Hide thetezos.com events'
                  : 'Show thetezos.com events'
              }
            >
              thetezos.com events
            </button>
            {ICS_URL && (
              <details className={styles.subscribe}>
                <summary className={styles.subscribe_toggle}>Subscribe</summary>
                <div className={styles.subscribe_panel}>
                  <span className={styles.subscribe_label}>
                    Teia events (on-chain)
                  </span>
                  <Button shadow_box small href={googleCal}>
                    Add to Google Calendar
                  </Button>
                  <Button shadow_box small href={webcal}>
                    Add to Apple / Outlook
                  </Button>
                  <Button shadow_box small secondary onClick={copy}>
                    {copied ? 'Copied!' : 'Copy feed URL'}
                  </Button>

                  <span className={styles.subscribe_label}>
                    thetezos.com events
                  </span>
                  <Button
                    shadow_box
                    small
                    secondary
                    href="https://thetezos.com/"
                  >
                    Subscribe on thetezos.com
                  </Button>

                  <p className={styles.subscribe_hint}>
                    We do display two separate feeds at the moment.
                    <br />
                    Subscribe to both to see all events.
                    <br />
                    Some apps can take up to a day to refresh a subscribed
                    calendar.
                  </p>
                </div>
              </details>
            )}
            {!isEditing && (
              <Button shadow_box fit onClick={startCreate} disabled={opening}>
                {opening
                  ? 'Opening…'
                  : canModerate
                  ? '+ New event'
                  : 'Propose an event'}
              </Button>
            )}
          </div>
        </header>

        {/* Month grid: click a day to view its events in a popup. */}
        {!isLoading && <MonthGrid events={events} {...cardHandlers} />}

        {editorModal}

        {error && (
          <p className={styles.error}>Could not load events: {error.message}</p>
        )}
        {actionError && (
          <p className={styles.error} role="alert">
            {actionError}
          </p>
        )}

        {isLoading && <Loading message="Loading calendar" />}
      </div>
    </Page>
  )
}
