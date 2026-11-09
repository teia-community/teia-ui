// Remembers the tags this browser has used when minting or posting, so the
// suggest button can offer someone their own vocabulary back instead of making
// them retype it.
//
// Device-local only: it never leaves localStorage, is never sent anywhere, and
// costs nothing on the server.

import { normalizeTag } from './tag-suggestions.mjs'

const KEY = 'teia:recent-tags'
/** Keep the list small; it is read on every suggest. */
const MAX = 150

/** @returns {string[]} tags most recently used first */
export function readRecentTags() {
  try {
    const stored = JSON.parse(localStorage.getItem(KEY) || '[]')
    return Array.isArray(stored)
      ? stored.map(normalizeTag).filter(Boolean).slice(0, MAX)
      : []
  } catch {
    // Private windows and blocked site data throw on read.
    return []
  }
}

/**
 * Records tags after a successful mint or post. Re-using a tag moves it back
 * to the front, so the list tracks what someone actually tags with.
 * @param {string[]|string} tags
 */
export function recordRecentTags(tags) {
  const used = (Array.isArray(tags) ? tags : String(tags || '').split(','))
    .map(normalizeTag)
    .filter(Boolean)
  if (used.length === 0) return

  try {
    const kept = readRecentTags().filter((tag) => !used.includes(tag))
    localStorage.setItem(KEY, JSON.stringify([...used, ...kept].slice(0, MAX)))
  } catch {
    // Nothing to do: suggestions simply fall back to the shared vocabulary.
  }
}
