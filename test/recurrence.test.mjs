import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  occurrenceAt,
  expandOccurrences,
  recurrenceLabel,
} from '../src/data/calendar-chain/recurrence.mjs'
import { buildICS } from '../src/utils/ics.mjs'

test('occurrenceAt steps each frequency from the anchor, preserving the time part', () => {
  assert.equal(occurrenceAt('2026-07-08T19:00', 'DAILY', 1, 1), '2026-07-09T19:00')
  assert.equal(occurrenceAt('2026-07-08T19:00', 'WEEKLY', 2, 1), '2026-07-22T19:00')
  assert.equal(occurrenceAt('2026-07-08', 'MONTHLY', 1, 1), '2026-08-08')
  assert.equal(occurrenceAt('2026-12-08', 'MONTHLY', 1, 1), '2027-01-08') // year rollover
  assert.equal(occurrenceAt('2026-07-08', 'YEARLY', 1, 1), '2027-07-08')
})

test('occurrenceAt: monthly on the 31st skips short months instead of rolling (RFC 5545)', () => {
  assert.equal(occurrenceAt('2026-01-31', 'MONTHLY', 1, 1), null) // Feb: skipped
  assert.equal(occurrenceAt('2026-01-31', 'MONTHLY', 1, 2), '2026-03-31') // no drift
  assert.equal(occurrenceAt('2024-02-29', 'YEARLY', 1, 1), null) // non-leap year
  assert.equal(occurrenceAt('2024-02-29', 'YEARLY', 1, 4), '2028-02-29')
})

test('expandOccurrences: weekly within window, preserving time + duration', () => {
  const occ = expandOccurrences(
    '2026-07-07T19:00',
    '2026-07-07T21:00',
    { freq: 'WEEKLY', interval: 1 },
    { windowStart: '2026-07-01', windowEnd: '2026-07-31' }
  )
  assert.deepEqual(
    occ.map((o) => o.startDate),
    [
      '2026-07-07T19:00',
      '2026-07-14T19:00',
      '2026-07-21T19:00',
      '2026-07-28T19:00',
    ]
  )
  assert.equal(occ[0].endDate, '2026-07-07T21:00') // 2h duration preserved
})

test('expandOccurrences: respects count (total occurrences from series start)', () => {
  const occ = expandOccurrences(
    '2026-07-07',
    '',
    { freq: 'DAILY', interval: 1, count: 3 },
    { windowStart: '2026-01-01', windowEnd: '2026-12-31' }
  )
  assert.deepEqual(
    occ.map((o) => o.startDate),
    ['2026-07-07', '2026-07-08', '2026-07-09']
  )
})

test('expandOccurrences: respects until (inclusive)', () => {
  const occ = expandOccurrences(
    '2026-07-07',
    '',
    { freq: 'DAILY', interval: 1, until: '2026-07-09' },
    { windowStart: '2026-01-01', windowEnd: '2026-12-31' }
  )
  assert.deepEqual(
    occ.map((o) => o.startDate),
    ['2026-07-07', '2026-07-08', '2026-07-09']
  )
})

test('expandOccurrences: window clips, but count still counts pre-window ones', () => {
  const occ = expandOccurrences(
    '2026-07-01',
    '',
    { freq: 'DAILY', interval: 1, count: 10 },
    { windowStart: '2026-07-05', windowEnd: '2026-07-07' }
  )
  assert.deepEqual(
    occ.map((o) => o.startDate),
    ['2026-07-05', '2026-07-06', '2026-07-07']
  )
})

test('expandOccurrences: monthly on the 31st yields only real 31sts, no duplicates', () => {
  const occ = expandOccurrences(
    '2026-01-31',
    '',
    { freq: 'MONTHLY', interval: 1 },
    { windowStart: '2026-01-01', windowEnd: '2026-06-30' }
  )
  assert.deepEqual(
    occ.map((o) => o.startDate),
    ['2026-01-31', '2026-03-31', '2026-05-31'] // Feb, Apr, Jun skipped
  )
})

test('expandOccurrences: unknown freq (untrusted JSON) expands to nothing', () => {
  const occ = expandOccurrences(
    '2026-07-07',
    '',
    { freq: 'BOGUS', interval: 1 },
    { windowStart: '2026-01-01', windowEnd: '2026-12-31' }
  )
  assert.deepEqual(occ, [])
})

test('recurrenceLabel', () => {
  assert.equal(
    recurrenceLabel({ freq: 'WEEKLY', interval: 1 }),
    'Repeats every week'
  )
  assert.equal(
    recurrenceLabel({ freq: 'WEEKLY', interval: 2, until: '2026-12-31' }),
    'Repeats every 2 weeks until 2026-12-31'
  )
  assert.equal(
    recurrenceLabel({ freq: 'DAILY', interval: 1, count: 5 }),
    'Repeats every day (5 times)'
  )
})

test('buildICS: RRULE with UNTIL matching a floating DTSTART', () => {
  const ics = buildICS({
    dtstamp: '2026-07-08T12:00:00Z',
    events: [
      {
        uid: 'chain-1@teia.art',
        sequence: 0,
        title: 'Weekly',
        start: '2026-07-07T19:00',
        recurrence: { freq: 'WEEKLY', interval: 1, until: '2026-12-31' },
      },
    ],
  })
  assert.match(ics, /RRULE:FREQ=WEEKLY;UNTIL=20261231T235959\r\n/)
})

test('buildICS: all-day UNTIL is a DATE; interval>1 and COUNT emitted', () => {
  const allday = buildICS({
    dtstamp: '2026-07-08T12:00:00Z',
    events: [
      {
        uid: 'a',
        sequence: 0,
        title: 'x',
        start: '2026-07-07',
        recurrence: { freq: 'MONTHLY', interval: 2, until: '2026-12-31' },
      },
    ],
  })
  assert.match(allday, /RRULE:FREQ=MONTHLY;INTERVAL=2;UNTIL=20261231\r\n/)

  const counted = buildICS({
    dtstamp: '2026-07-08T12:00:00Z',
    events: [
      {
        uid: 'b',
        sequence: 0,
        title: 'y',
        start: '2026-07-07T19:00',
        recurrence: { freq: 'DAILY', interval: 1, count: 5 },
      },
    ],
  })
  assert.match(counted, /RRULE:FREQ=DAILY;COUNT=5\r\n/)
})

test('buildICS: URL is dropped unless http(s)/mailto, and CR/LF cannot inject lines', () => {
  const ics = buildICS({
    dtstamp: '2026-07-08T12:00:00Z',
    events: [
      {
        uid: 'a',
        sequence: 0,
        title: 'x',
        start: '2026-07-07',
        url: 'javascript:alert(1)',
      },
      {
        uid: 'b',
        sequence: 0,
        title: 'y',
        start: '2026-07-07',
        url: 'https://x.example/\r\nATTENDEE:mailto:a@b.test',
      },
    ],
  })
  assert.doesNotMatch(ics, /javascript:/)
  assert.doesNotMatch(ics, /^ATTENDEE:/m)
  assert.match(ics, /URL:https:\/\/x.example\/ATTENDEE:mailto:a@b.test\r\n/)
})

test('buildICS: RRULE is omitted for invalid freq or non-date until (no injection)', () => {
  const ics = buildICS({
    dtstamp: '2026-07-08T12:00:00Z',
    events: [
      {
        uid: 'a',
        sequence: 0,
        title: 'x',
        start: '2026-07-07',
        recurrence: { freq: 'DAILY\r\nBEGIN:VALARM', interval: 1 },
      },
      {
        uid: 'b',
        sequence: 0,
        title: 'y',
        start: '2026-07-07',
        recurrence: { freq: 'DAILY', interval: 1, until: 'evil\r\npayload' },
      },
    ],
  })
  assert.doesNotMatch(ics, /RRULE/)
  assert.doesNotMatch(ics, /VALARM/)
})

test('buildICS: an event with a missing/garbage start is skipped, not fatal', () => {
  const ics = buildICS({
    dtstamp: '2026-07-08T12:00:00Z',
    events: [
      { uid: 'bad', sequence: 0, title: 'no start' },
      { uid: 'ok', sequence: 0, title: 'fine', start: '2026-07-07' },
    ],
  })
  assert.doesNotMatch(ics, /UID:bad/)
  assert.match(ics, /UID:ok\r\n/)
})

test('buildICS: calName is escaped', () => {
  const ics = buildICS({
    dtstamp: '2026-07-08T12:00:00Z',
    calName: 'evil\r\nX-INJECTED:1',
    events: [],
  })
  assert.doesNotMatch(ics, /^X-INJECTED:/m)
  assert.match(ics, /X-WR-CALNAME:evil\\nX-INJECTED:1\r\n/)
})
