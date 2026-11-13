import { useEffect, useRef, useState } from 'react'
import { Loading } from '@atoms/loading'
import { useEvents } from '@hooks/use-events'
import { filterEvents } from '@data/search'
import styles from '@pages/events/index.module.scss'
import homeStyles from '@style'

function getBannerTextColor(hex) {
  const value = hex?.replace('#', '')
  if (!value || value.length !== 6) return '#191919'

  const [r, g, b] = [0, 2, 4].map((offset) =>
    parseInt(value.slice(offset, offset + 2), 16)
  )
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.6 ? '#191919' : '#ffffff'
}

/**
 * Events tab of the search page, copied from the events page: same cards and
 * preview dialog, filtered to events matching `term`.
 */
export default function EventsSearchResults({ term }) {
  const [selectedEvent, setSelectedEvent] = useState(null)
  const dialogRef = useRef(null)
  const { events, error, isLoading } = useEvents()
  const matches = filterEvents(events, term)

  useEffect(() => {
    if (!selectedEvent) return undefined

    const dialog = dialogRef.current
    dialog?.showModal()

    const closeOnEscape = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        dialog?.close()
        setSelectedEvent(null)
      }
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => {
      window.removeEventListener('keydown', closeOnEscape)
      if (dialog?.open) dialog.close()
    }
  }, [selectedEvent])

  return (
    <>
      <div className={styles.container}>
        {!isLoading && !error && (
          <div className={styles.event_list}>
            {matches.map((event) => (
              <article className={styles.event_card} key={event.id}>
                <div className={styles.card_content}>
                  <div className={styles.card_copy}>
                    <h2>{event.title}</h2>
                    <p className={styles.subtitle}>{event.subtitle}</p>
                    <p>{event.description}</p>
                    <a href={event.link} target="_blank" rel="noreferrer">
                      Visit event site ↗
                    </a>
                  </div>
                  <button
                    type="button"
                    className={styles.preview}
                    onClick={() => setSelectedEvent(event)}
                    aria-label={`Preview ${event.title}`}
                  >
                    <img src={event.screenshot} alt="" loading="lazy" />
                    <span>Preview</span>
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}

        {!isLoading && !error && !matches.length && (
          <div className={homeStyles.empty_section}>
            <h1>no results</h1>
          </div>
        )}

        {error && (
          <p className={styles.error} role="alert">
            Could not load events: {error.message}
          </p>
        )}

        {isLoading && <Loading message="Loading events" />}
      </div>

      {selectedEvent && (
        <dialog
          ref={dialogRef}
          className={styles.dialog}
          onCancel={() => setSelectedEvent(null)}
        >
          <div className={styles.dialog_panel}>
            <div
              className={styles.dialog_header}
              style={{
                backgroundColor: selectedEvent.bannerColor,
                color: getBannerTextColor(selectedEvent.bannerColor),
              }}
            >
              <div className={styles.dialog_summary}>
                <h2>{selectedEvent.title}</h2>
                <p>{selectedEvent.subtitle}</p>
                <span>{selectedEvent.description}</span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEvent(null)}
                aria-label="Close preview"
                style={{ color: getBannerTextColor(selectedEvent.bannerColor) }}
              >
                ×
              </button>
            </div>
            <iframe
              src={selectedEvent.link}
              title={`${selectedEvent.title} preview`}
              className={styles.iframe}
            />
          </div>
        </dialog>
      )}
    </>
  )
}
