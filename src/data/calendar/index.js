/**
 * Calendar data access — single point of indirection over the storage backend.
 *
 * The rest of the app imports `calendarDB` from here and never touches a
 * concrete backend directly. Today that backend is IndexedDB (browser-local,
 * no server, no network).
 *
 * ## Swapping to Postgres later
 * Write a module exporting the same five functions (`list`, `get`, `create`,
 * `update`, `remove`) that call your API, and point `calendarDB` at it.
 * Authorize writes server-side with a Beacon signed-message check — the
 * client-side CALENDAR_ADMINS gate is UI convenience, not security. Shape:
 *
 *   const API = import.meta.env.VITE_CALENDAR_API
 *   export async function list() {
 *     const res = await fetch(`${API}/events`)
 *     if (!res.ok) throw new Error(res.statusText)
 *     return res.json()
 *   }
 *   export async function create(input) {
 *     const res = await fetch(`${API}/events`, {
 *       method: 'POST',
 *       headers: { 'content-type': 'application/json' },
 *       body: JSON.stringify(input),
 *     })
 *     if (!res.ok) throw new Error(res.statusText)
 *     return res.json()
 *   }
 *   // ...get / update / remove likewise
 *
 * The schema docblock in ./schema.js maps the event shape to a
 * `calendar_events` table 1:1.
 */
import { backend as indexedDbBackend } from './indexeddb'
import { backend as tempApiBackend, hasTempCalendarAPI } from './temp-api'

function isTempEvent(id) {
  return String(id || '').startsWith('temp-')
}

function sortEvents(events) {
  return events.sort((a, b) =>
    (a.startDate || '').localeCompare(b.startDate || '')
  )
}

/**
 * Temporary bridge backend.
 *
 * Reads include browser-local IndexedDB records plus the shared Netlify
 * Functions/Blobs records when VITE_CALENDAR_TEMP_API is configured. Writes go
 * to the shared temp API for temp ids, while legacy/demo local records remain
 * editable in IndexedDB.
 */
export const calendarDB = {
  async list() {
    const local = await indexedDbBackend.list()
    if (!hasTempCalendarAPI) return local

    const remote = await tempApiBackend.list()
    const events = new Map()
    for (const event of local) events.set(event.id, event)
    for (const event of remote) events.set(event.id, event)
    return sortEvents([...events.values()])
  },

  async get(id) {
    if (hasTempCalendarAPI && isTempEvent(id)) return tempApiBackend.get(id)
    return indexedDbBackend.get(id)
  },

  async create(input, options) {
    if (hasTempCalendarAPI) return tempApiBackend.create(input, options)
    return indexedDbBackend.create(input)
  },

  async update(id, patch, options) {
    if (hasTempCalendarAPI && isTempEvent(id)) {
      return tempApiBackend.update(id, patch, options)
    }
    return indexedDbBackend.update(id, patch)
  },

  async remove(id, options) {
    if (hasTempCalendarAPI && isTempEvent(id)) {
      return tempApiBackend.remove(id, options)
    }
    return indexedDbBackend.remove(id)
  },

  async validatePassword(password) {
    if (!hasTempCalendarAPI) return true
    return tempApiBackend.validatePassword(password)
  },

  async uploadImage(file, options) {
    if (!hasTempCalendarAPI) {
      throw new Error('Calendar image uploads require VITE_CALENDAR_TEMP_API')
    }
    return tempApiBackend.uploadImage(file, options)
  },
}

export { blankEvent } from './schema'
export { hasTempCalendarAPI } from './temp-api'
