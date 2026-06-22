/**
 * IndexedDB calendar backend.
 *
 * A self-contained, dependency-free store that implements the calendar data
 * interface ({@link list}, {@link get}, {@link create}, {@link update},
 * {@link remove}). It is a stand-in for a real database — to swap it out, point
 * `@data/calendar` at `./postgres` (same interface) instead of this module.
 *
 * Everything here runs in the browser; there are no network calls.
 */
import { blankEvent } from './schema'

const DB_NAME = 'teia-calendar'
const DB_VERSION = 1
const STORE = 'events'

let dbPromise

/**
 * Open (and lazily migrate) the database. The connection is cached so repeated
 * calls share one handle; a failed open clears the cache so the next call can
 * retry.
 * @returns {Promise<IDBDatabase>}
 */
function openDB() {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION)
      req.onupgradeneeded = () => {
        const db = req.result
        if (!db.objectStoreNames.contains(STORE)) {
          const store = db.createObjectStore(STORE, { keyPath: 'id' })
          store.createIndex('startDate', 'startDate', { unique: false })
        }
      }
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => reject(req.error)
    })
    dbPromise.catch(() => {
      dbPromise = undefined
    })
  }
  return dbPromise
}

/** Wrap an IDBRequest in a promise. */
function asPromise(req) {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

/** Grab the object store for a transaction. */
function store(db, mode) {
  return db.transaction(STORE, mode).objectStore(STORE)
}

function nowISO() {
  return new Date().toISOString()
}

/** crypto.randomUUID needs a secure context; fall back for plain-http dev. */
function makeId() {
  if (crypto.randomUUID) return crypto.randomUUID()
  return Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) =>
    b.toString(16).padStart(2, '0')
  ).join('')
}

/**
 * List all events, soonest first.
 * @returns {Promise<import('./schema').CalendarEvent[]>}
 */
export async function list() {
  const db = await openDB()
  // Mock seeding is retired: the calendar is now populated from the WordPress
  // `mec-events` feed (see @data/calendar/wordpress). IndexedDB now holds only
  // events the user creates locally. Re-enable seedMocks(db) to restore demos.
  const events = await asPromise(store(db, 'readonly').getAll())
  return events.sort((a, b) =>
    (a.startDate || '').localeCompare(b.startDate || '')
  )
}

/**
 * Get a single event by id.
 * @param {string} id
 * @returns {Promise<import('./schema').CalendarEvent | undefined>}
 */
export async function get(id) {
  const db = await openDB()
  return asPromise(store(db, 'readonly').get(id))
}

/**
 * Create an event. The caller (an admin gate) is responsible for authorization.
 * @param {Partial<import('./schema').CalendarEvent>} input
 * @returns {Promise<import('./schema').CalendarEvent>}
 */
export async function create(input) {
  const db = await openDB()
  const ts = nowISO()
  const event = {
    ...blankEvent(),
    ...input,
    id: makeId(),
    createdAt: ts,
    updatedAt: ts,
  }
  await asPromise(store(db, 'readwrite').add(event))
  return event
}

/**
 * Patch an existing event.
 * @param {string} id
 * @param {Partial<import('./schema').CalendarEvent>} patch
 * @returns {Promise<import('./schema').CalendarEvent>}
 */
export async function update(id, patch) {
  const db = await openDB()
  const existing = await asPromise(store(db, 'readonly').get(id))
  if (!existing) throw new Error(`Calendar event "${id}" not found`)
  const updated = { ...existing, ...patch, id, updatedAt: nowISO() }
  await asPromise(store(db, 'readwrite').put(updated))
  return updated
}

/**
 * Delete an event.
 * @param {string} id
 * @returns {Promise<void>}
 */
export async function remove(id) {
  const db = await openDB()
  await asPromise(store(db, 'readwrite').delete(id))
}

/** The backend interface, bundled for `@data/calendar` to re-export. */
export const backend = { list, get, create, update, remove }
