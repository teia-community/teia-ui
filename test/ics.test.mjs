import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildICS, escapeText, foldLine, formatDtStart } from '../src/utils/ics.mjs'

test('escapeText escapes backslash first, then semicolon/comma/newline', () => {
  assert.equal(escapeText('a\\b'), 'a\\\\b')
  assert.equal(escapeText('a;b,c'), 'a\\;b\\,c')
  assert.equal(escapeText('a\nb'), 'a\\nb')
  assert.equal(escapeText('a\r\nb'), 'a\\nb')
  // backslash-first ordering: a literal backslash-n should become \\n, not \n
  assert.equal(escapeText('a\\nb'), 'a\\\\nb')
})

test('foldLine folds at 75 octets without splitting a multi-byte char', () => {
  const long = 'DESCRIPTION:' + 'a'.repeat(100)
  const folded = foldLine(long)
  const lines = folded.split('\r\n')
  assert.ok(lines.length > 1)
  for (const line of lines) {
    assert.ok(Buffer.byteLength(line, 'utf8') <= 75)
  }
  // multi-byte char (emoji, 4 bytes in UTF-8) must never be split
  const multiByte = 'SUMMARY:' + 'x'.repeat(70) + '🎉'.repeat(5)
  const foldedMb = foldLine(multiByte)
  assert.ok(!foldedMb.includes('�'))
  const rejoined = foldedMb.replace(/\r\n /g, '')
  assert.equal(rejoined, multiByte)
})

test('all-day event emits DTSTART;VALUE=DATE and exclusive +1-day DTEND', () => {
  const ics = buildICS({
    dtstamp: '2026-01-01T00:00:00Z',
    events: [
      {
        uid: 'a@teia.art',
        sequence: 0,
        title: 'All day',
        start: '2026-06-15',
      },
    ],
  })
  assert.match(ics, /DTSTART;VALUE=DATE:20260615/)
  assert.match(ics, /DTEND;VALUE=DATE:20260616/)
})

test('all-day event handles year rollover (2026-12-31 -> 2027-01-01)', () => {
  const ics = buildICS({
    dtstamp: '2026-01-01T00:00:00Z',
    events: [
      {
        uid: 'b@teia.art',
        sequence: 0,
        title: 'Year end',
        start: '2026-12-31',
      },
    ],
  })
  assert.match(ics, /DTSTART;VALUE=DATE:20261231/)
  assert.match(ics, /DTEND;VALUE=DATE:20270101/)
})

test('timed zoned event converts +02:00 offset to UTC', () => {
  // 2026-06-15T12:00:00+02:00 => 2026-06-15T10:00:00Z
  const value = formatDtStart('2026-06-15T12:00:00+02:00')
  assert.equal(value, '20260615T100000Z')

  const ics = buildICS({
    dtstamp: '2026-01-01T00:00:00Z',
    events: [
      {
        uid: 'c@teia.art',
        sequence: 0,
        title: 'Zoned',
        start: '2026-06-15T12:00:00+02:00',
      },
    ],
  })
  assert.match(ics, /DTSTART:20260615T100000Z/)
})

test('floating (naive) event is not shifted and has no Z/TZID', () => {
  const value = formatDtStart('2026-06-15T09:30:00')
  assert.equal(value, '20260615T093000')

  const ics = buildICS({
    dtstamp: '2026-01-01T00:00:00Z',
    events: [
      {
        uid: 'd@teia.art',
        sequence: 0,
        title: 'Floating',
        start: '2026-06-15T09:30:00',
      },
    ],
  })
  assert.match(ics, /DTSTART:20260615T093000\r\n/)
  assert.doesNotMatch(ics, /DTSTART:20260615T093000Z/)
  assert.doesNotMatch(ics, /TZID/)
})

test('empty feed produces a valid VCALENDAR skeleton', () => {
  const ics = buildICS({ events: [], dtstamp: '2026-01-01T00:00:00Z' })
  assert.match(ics, /^BEGIN:VCALENDAR\r\n/)
  assert.match(ics, /VERSION:2\.0\r\n/)
  assert.match(ics, /END:VCALENDAR\r\n$/)
  assert.doesNotMatch(ics, /BEGIN:VEVENT/)
})

test('UID/SEQUENCE pass through and DTSTAMP falls back to feed dtstamp, always Z', () => {
  const ics = buildICS({
    dtstamp: '2026-03-04T05:06:07Z',
    events: [
      {
        uid: 'my-uid@teia.art',
        sequence: 7,
        title: 'Event',
        start: '2026-06-15',
      },
    ],
  })
  assert.match(ics, /UID:my-uid@teia\.art/)
  assert.match(ics, /SEQUENCE:7/)
  assert.match(ics, /DTSTAMP:20260304T050607Z/)

  const withOwnStamp = buildICS({
    dtstamp: '2026-03-04T05:06:07Z',
    events: [
      {
        uid: 'e@teia.art',
        sequence: 0,
        title: 'Event',
        start: '2026-06-15',
        dtstamp: '2026-07-08T01:02:03Z',
      },
    ],
  })
  assert.match(withOwnStamp, /DTSTAMP:20260708T010203Z/)
})

test('every line is CRLF-terminated', () => {
  const ics = buildICS({
    dtstamp: '2026-01-01T00:00:00Z',
    events: [
      {
        uid: 'f@teia.art',
        sequence: 0,
        title: 'Event',
        start: '2026-06-15',
        description: 'Some description',
        location: 'Somewhere',
        url: 'https://teia.art',
      },
    ],
  })
  assert.ok(ics.endsWith('\r\n'))
  assert.ok(!ics.includes('\r\n\n'))
  // Splitting on \r\n and rejoining should reproduce the string exactly,
  // proving every line break is CRLF (not bare \n or \r).
  const withoutTrailing = ics.slice(0, -2)
  assert.equal(withoutTrailing.split('\r\n').join('\r\n'), withoutTrailing)
  assert.ok(!/[^\r]\n/.test(ics))
})

test('single-element events array is a valid single-event .ics', () => {
  const ics = buildICS({
    dtstamp: '2026-01-01T00:00:00Z',
    events: [
      { uid: 'g@teia.art', sequence: 0, title: 'Solo', start: '2026-06-15' },
    ],
  })
  const beginCount = (ics.match(/BEGIN:VEVENT/g) || []).length
  assert.equal(beginCount, 1)
})
