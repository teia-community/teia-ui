import { buildICS } from './ics.mjs'

const slug = (s) =>
  (s || 'event')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60) || 'event'

/** Download a single CalendarEvent as a one-shot .ics file. */
export function downloadEventICS(event) {
  const ics = buildICS({
    calName: event.title || 'Event',
    dtstamp: new Date().toISOString(),
    events: [
      {
        uid: `${event.id}@teia.art`,
        sequence: 0,
        title: event.title,
        start: event.startDate,
        end: event.endDate || undefined,
        description: event.description,
        location: event.location,
        url: event.links?.[0]?.url,
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
