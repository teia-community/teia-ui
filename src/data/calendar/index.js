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

/** @type {{ list: Function, get: Function, create: Function, update: Function, remove: Function }} */
export const calendarDB = indexedDbBackend

export { blankEvent } from './schema'
