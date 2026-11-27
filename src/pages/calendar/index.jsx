import { useEffect, useMemo, useState } from 'react'
import useClipboard from 'react-use-clipboard'
import { Page } from '@atoms/layout'
import { Button } from '@atoms/button'
import { Loading } from '@atoms/loading'
import Tour, { Hint, TourLink } from '@components/tour'
import { useCalendarEvents } from '@hooks/use-calendar'
import { useCalendarRoles } from '@data/calendar-chain'
import useChainEventEditor from '@components/calendar/useChainEventEditor'
import MonthGrid from '@components/calendar/MonthGrid'
import DayView from '@components/calendar/DayView'
import styles from '@style'

/**
 * Calendar page — community events live on the teiaCalendar contract:
 *  - moderators / multisig create/edit/hide directly + approve/reject proposals;
 *  - TEIA holders propose new events and edits;
 *  - everyone else views + subscribes, and gets a "get TEIA" prompt.
 * WordPress events are merged in read-only.
 */
const SHOW_TTC_KEY = 'calendar:showTtc'
const DAY_VIEW_KEY = 'calendar:dayView'
// Matches the page's mobile breakpoint (index.module.scss).
const MOBILE_QUERY = '(max-width: 600px)'

const CALENDAR_TOUR = [
  {
    target: 'bar',
    text: 'Light bars are one-day events. Dark bars mark where a multi-day event starts and ends.',
  },
  {
    target: 'day',
    text: 'Click a day to see all its events, or hover a bar and click its ? to jump to that event.',
  },
  { target: 'ttc', text: 'Show or hide events from thetezos.com.' },
  {
    target: 'subscribe',
    text: 'Add the calendar to Google, Apple or Outlook.',
    align: 'right',
  },
]

// Mobile Day View has its own controls, so its own tour.
const DAY_VIEW_TOUR = [
  { target: 'day-month', text: 'Step through months with the arrows.' },
  { target: 'day-weeks', text: 'Jump to a week of the month.' },
  {
    target: 'day-strip',
    text: 'Pick a day. The number under each day counts its events.',
  },
  {
    target: 'view-toggle',
    text: 'Switch back to the full month view.',
    align: 'right',
  },
]

export default function Calendar() {
  const {
    events: allEvents,
    isLoading,
    error,
    horizon,
    extending,
    extendHorizon,
  } = useCalendarEvents()

  // Toggle for thetezos.com (TTC) events.
  const [showTtc, setShowTtc] = useState(() => {
    if (typeof window === 'undefined') return true
    return window.localStorage.getItem(SHOW_TTC_KEY) !== '0'
  })
  useEffect(() => {
    window.localStorage.setItem(SHOW_TTC_KEY, showTtc ? '1' : '0')
  }, [showTtc])

  // Opt-in single-day view, mobile only.
  const [dayView, setDayView] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.localStorage.getItem(DAY_VIEW_KEY) === '1'
  })
  useEffect(() => {
    window.localStorage.setItem(DAY_VIEW_KEY, dayView ? '1' : '0')
  }, [dayView])
  // Points at the view toggle on every visit until closed or used.
  const [hintClosed, setHintClosed] = useState(false)

  const [isMobile, setIsMobile] = useState(
    () =>
      typeof window !== 'undefined' && window.matchMedia(MOBILE_QUERY).matches
  )
  useEffect(() => {
    const mq = window.matchMedia(MOBILE_QUERY)
    const onChange = () => setIsMobile(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

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
    <Page
      title="Teia Calendar"
      description="The Teia community calendar: exhibitions, mint events and meetups, kept on the Tezos blockchain."
    >
      <Tour name="calendar" steps={CALENDAR_TOUR} />
      <Tour name="dayview" steps={DAY_VIEW_TOUR} />
      <div className={styles.container}>
        {/* Mobile only: the toggle is hidden on desktop, so Hint can't place it.
            Only while it offers Day View, not Month View. */}
        {isMobile && !dayView && !hintClosed && (
          <Hint
            target="view-toggle"
            title="Try on Mobile"
            onClose={() => setHintClosed(true)}
          />
        )}
        <header className={styles.header}>
          <h1 className={styles.headline}>
            Calendar{' '}
            <TourLink
              name={dayView && isMobile ? 'dayview' : 'calendar'}
              title="How the calendar works"
            />
          </h1>
          <div className={styles.header_actions}>
            <button
              type="button"
              data-tour="ttc"
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
            <button
              type="button"
              className={`${styles.ttc_toggle} ${styles.day_toggle}`}
              data-tour="view-toggle"
              onClick={() => {
                setDayView((v) => !v)
                setHintClosed(true)
              }}
            >
              {/* Names the view this switches to. */}
              {dayView ? 'Month View' : 'Day View'}
            </button>
            {ICS_URL && (
              <details className={styles.subscribe} data-tour="subscribe">
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
              <Button
                shadow_box
                fit
                className={styles.propose}
                onClick={startCreate}
                disabled={opening}
              >
                {opening
                  ? 'Opening…'
                  : canModerate
                  ? '+ New event'
                  : 'Propose an event'}
              </Button>
            )}
          </div>
        </header>

        {/* Month grid (or opt-in day view on mobile): pick a day to see its events. */}
        {!isLoading &&
          (dayView && isMobile ? (
            <DayView
              events={events}
              {...cardHandlers}
              horizon={showTtc ? horizon : ''}
              extending={extending}
              onExtendHorizon={extendHorizon}
            />
          ) : (
            <MonthGrid
              events={events}
              {...cardHandlers}
              /* Only offer to load more TTC events when they are being shown. */
              horizon={showTtc ? horizon : ''}
              extending={extending}
              onExtendHorizon={extendHorizon}
            />
          ))}

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
