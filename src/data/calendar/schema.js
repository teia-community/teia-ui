/**
 * Calendar event schema (intentionally tiny — this is a thin scaffold).
 *
 * Kept backend-agnostic so the same shape works whether the rows live in
 * IndexedDB (current) or a Postgres table behind a REST API (future). When
 * moving to Postgres, this maps cleanly to a single `calendar_events` table:
 *
 *   id          text primary key
 *   title       text not null
 *   description text
 *   start_date  text   -- ISO 8601 / 'YYYY-MM-DDTHH:mm'
 *   end_date    text
 *   location    text
 *   links       jsonb  -- [{ label, url }]
 *   images      jsonb  -- [url, ...]  (rendered as a carousel)
 *   created_by  text   -- wallet address of the editor
 *   created_at  timestamptz
 *   updated_at  timestamptz
 *
 * @typedef {{ label: string, url: string }} CalendarLink
 *
 * @typedef {Object} CalendarEvent
 * @property {string}         id
 * @property {string}         title
 * @property {string}         description
 * @property {string}         startDate   ISO 8601 / `datetime-local` value
 * @property {string}         [endDate]
 * @property {string}         [location]
 * @property {string}         [tags]      comma-separated tags (form state)
 * @property {CalendarLink[]} links       external links shown on the card
 * @property {string[]}       images      image URLs rendered in a carousel
 * @property {string}         [createdBy] wallet address that last wrote it
 * @property {string}         createdAt
 * @property {string}         updatedAt
 * @property {string}         [source]
 */

/**
 * A blank event used to seed the create form and to guarantee every record has
 * the full set of fields regardless of what the caller passes in.
 * @returns {CalendarEvent}
 */
export function blankEvent() {
  return {
    id: '',
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    location: '',
    tags: '',
    links: [],
    images: [],
    createdBy: '',
    createdAt: '',
    updatedAt: '',
  }
}
