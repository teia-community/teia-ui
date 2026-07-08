import { buildICS } from './ics.mjs'

const slug = (s) =>
  (s || 'event')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60) || 'event'

/** Download a single CalendarEvent as a one-shot .ics file. */
export function downloadEventICS(event) {
  // Recurring: emit the RRULE anchored at the series' first start, not at the
  // clicked occurrence — re-anchoring would shift a COUNT-bound series. The
  // UID also drops the occurrence suffix (`chain-<n>::<iso>`) so downloading
  // the series from two occurrences dedupes to one series on import.
  const isSeries = Boolean(event.recurrence?.freq && event.seriesStart)
  const ics = buildICS({
    calName: event.title || 'Event',
    dtstamp: new Date().toISOString(),
    events: [
      {
        uid: `${String(event.id).split('::')[0]}@teia.art`,
        sequence: 0,
        title: event.title,
        start: isSeries ? event.seriesStart : event.startDate,
        end: (isSeries ? event.seriesEnd : event.endDate) || undefined,
        description: event.description,
        location: event.location,
        url: event.links?.[0]?.url,
        recurrence: event.recurrence,
      },
    ],
  })
  const url = URL.createObjectURL(
    new Blob([ics], { type: 'text/calendar;charset=utf-8' })
  )
  const a = document.createElement('a')
  a.href = url
  a.download = `${slug(event.title)}.ics`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
