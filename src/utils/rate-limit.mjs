// Backing off when an API says we are asking too fast.

/** The statuses worth trying again: rate limits and a server's bad moment. */
export function shouldRetry(status) {
  return status === 429 || status === 408 || status >= 500
}

/**
 * How long to wait before attempt number `attempt` + 1, in milliseconds.
 *
 * A `Retry-After` header is the server telling us when it will listen again,
 * so it wins over our own guess; without one we back off exponentially. Both
 * are capped, because a page that waits half a minute has failed anyway.
 *
 * @param {number} attempt     zero-based attempt that just failed
 * @param {string|null} [retryAfter]  the Retry-After header, in seconds
 */
export function retryDelay(attempt, retryAfter) {
  const seconds = Number(retryAfter)
  if (Number.isFinite(seconds) && seconds > 0) {
    return Math.min(seconds * 1000, 10_000)
  }
  return Math.min(400 * Math.pow(2, attempt), 5_000)
}

/** What to tell someone whose page did not load. */
export function apiErrorMessage(status) {
  if (status === 429) {
    return 'the chain indexer is rate limiting this browser; it should clear in a moment'
  }
  if (status >= 500) {
    return `the chain indexer is having trouble (${status})`
  }
  return `the chain indexer said ${status}`
}
