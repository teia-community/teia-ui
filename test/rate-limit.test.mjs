import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  shouldRetry,
  retryDelay,
  apiErrorMessage,
} from '../src/utils/rate-limit.mjs'

test('a rate limit or a server stumble is worth retrying', () => {
  assert.equal(shouldRetry(429), true)
  assert.equal(shouldRetry(503), true)
  assert.equal(shouldRetry(408), true)
})

test('asking again for something that is not there would not help', () => {
  assert.equal(shouldRetry(404), false)
  assert.equal(shouldRetry(400), false)
  assert.equal(shouldRetry(200), false)
})

test('without a header the wait doubles, up to a ceiling', () => {
  assert.equal(retryDelay(0), 400)
  assert.equal(retryDelay(1), 800)
  assert.equal(retryDelay(2), 1600)
  assert.equal(retryDelay(10), 5000)
})

test('the server saying when to come back wins over our guess', () => {
  assert.equal(retryDelay(0, '2'), 2000)
  assert.equal(retryDelay(3, '1'), 1000)
  // A header we cannot read is no header at all.
  assert.equal(retryDelay(1, 'Wed, 21 Oct 2026 07:28:00 GMT'), 800)
  assert.equal(retryDelay(1, null), 800)
  // And a server asking for a minute still does not get one.
  assert.equal(retryDelay(0, '60'), 10000)
})

test('the message says what happened without saying "429"', () => {
  assert.match(apiErrorMessage(429), /rate limiting/)
  assert.match(apiErrorMessage(502), /trouble \(502\)/)
  assert.equal(apiErrorMessage(404), 'the chain indexer said 404')
})
