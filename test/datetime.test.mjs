import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  isAllDay,
  isZoned,
  toUTC,
  toLocalInput,
  localDayKey,
  toInstant,
} from '../src/utils/datetime.mjs'

// These tests are written to be timezone-independent: instead of asserting
// absolute UTC digits (which depend on the machine's TZ), they assert
// round-trip and local-day properties that hold in any timezone.

test('isAllDay / isZoned classify the three storage shapes', () => {
  assert.equal(isAllDay('2026-07-09'), true)
  assert.equal(isAllDay('2026-07-09T03:52'), false)
  assert.equal(isZoned('2026-07-09T03:52:00Z'), true)
  assert.equal(isZoned('2026-07-09T03:52+02:00'), true)
  assert.equal(isZoned('2026-07-09T03:52'), false) // naive/floating
  assert.equal(isZoned('2026-07-09'), false)
})

test('toUTC leaves all-day dates and empty values untouched', () => {
  assert.equal(toUTC('2026-07-09'), '2026-07-09')
  assert.equal(toUTC(''), '')
  assert.equal(toUTC(undefined), '')
})

test('toUTC produces a Z instant with no milliseconds', () => {
  const out = toUTC('2026-07-09T03:52')
  assert.match(out, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/)
})

test('toLocalInput(toUTC(x)) round-trips a timed value in any timezone', () => {
  // The load->save no-op: editing an event without changing the time must not
  // shift it. Holds regardless of the machine offset because toUTC applies the
  // local offset and toLocalInput removes it.
  for (const local of ['2026-07-09T03:52', '2026-01-01T00:00', '2026-12-31T23:59']) {
    assert.equal(toLocalInput(toUTC(local)), local)
  }
})

test('toLocalInput keeps naive/legacy digits and passes all-day through', () => {
  assert.equal(toLocalInput('2026-07-09T15:00'), '2026-07-09T15:00')
  assert.equal(toLocalInput('2026-07-09T15:00:30'), '2026-07-09T15:00') // trims to :mm
  assert.equal(toLocalInput('2026-07-09'), '2026-07-09')
  assert.equal(toLocalInput(''), '')
})

test('localDayKey returns the viewer local day of a zoned instant', () => {
  // Build the instant FROM a known local wall time, so the expected local day
  // is fixed independent of TZ. An event at 01:00 local on Jul 9...
  const early = new Date(2026, 6, 9, 1, 0).toISOString()
  assert.equal(localDayKey(early), '2026-07-09')
  // ...and at 23:30 local on Jul 9 (whose UTC date may be Jul 10 in +offsets,
  // proving we use the local day, not a naive slice of the UTC string).
  const late = new Date(2026, 6, 9, 23, 30).toISOString()
  assert.equal(localDayKey(late), '2026-07-09')
})

test('localDayKey slices floating and all-day values literally', () => {
  assert.equal(localDayKey('2026-07-09T15:00'), '2026-07-09')
  assert.equal(localDayKey('2026-07-09'), '2026-07-09')
  assert.equal(localDayKey(''), '')
})

test('toInstant orders events and parses all-day as local midnight', () => {
  assert.ok(toInstant('2026-07-09T10:00') > toInstant('2026-07-09T09:00'))
  assert.equal(toInstant('2026-07-09'), new Date('2026-07-09T00:00:00').getTime())
  assert.ok(Number.isNaN(toInstant('')))
})
