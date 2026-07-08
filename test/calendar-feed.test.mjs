import { test } from 'node:test'
import assert from 'node:assert/strict'
import handler from '../functions/calendar-feed.mjs'

// Exercises the full function data path (TZKT bigmap read -> hidden filter ->
// IPFS fetch -> map -> buildICS) with the network stubbed, so we verify the
// populated feed without needing events on-chain.

const realFetch = global.fetch

/** Route stubbed fetch by URL substring/regex to a JSON body. */
function stubFetch(routes) {
  global.fetch = async (url) => {
    const u = String(url)
    for (const [match, body] of routes) {
      if (match.test(u)) {
        return new Response(JSON.stringify(body), { status: 200 })
      }
    }
    return new Response('not found', { status: 404 })
  }
}

test('feed maps on-chain events to VEVENTs and drops hidden ones', async () => {
  process.env.CALENDAR_CONTRACT = 'KT1TEST'
  stubFetch([
    [
      /\/bigmaps\/events\/keys/,
      [
        {
          key: '1',
          value: { current_cid: 'cidVisible', hidden: false, version_count: '2' },
        },
        {
          key: '2',
          value: { current_cid: 'cidHidden', hidden: true, version_count: '0' },
        },
      ],
    ],
    [
      /cidVisible$/,
      {
        title: 'Visible Event',
        startDate: '2026-08-01T18:00:00Z',
        endDate: '2026-08-01T20:00:00Z',
        location: 'Online',
        description: 'Hello, world',
        links: [{ label: 'site', url: 'https://teia.art/e/1' }],
      },
    ],
    [/cidHidden$/, { title: 'Hidden Event', startDate: '2026-08-02' }],
  ])

  try {
    const res = await handler(new Request('http://localhost/calendar.ics'))
    const body = await res.text()

    assert.equal(res.status, 200)
    assert.equal(
      res.headers.get('content-type'),
      'text/calendar; charset=utf-8'
    )
    // Exactly one VEVENT — the hidden one is excluded.
    assert.equal((body.match(/BEGIN:VEVENT/g) || []).length, 1)
    assert.match(body, /UID:chain-1@teia\.art/)
    assert.match(body, /SEQUENCE:2/)
    assert.match(body, /SUMMARY:Visible Event/)
    assert.match(body, /DESCRIPTION:Hello\\, world/) // comma escaped
    assert.match(body, /DTSTART:20260801T180000Z/)
    assert.match(body, /DTEND:20260801T200000Z/)
    assert.match(body, /LOCATION:Online/)
    assert.match(body, /URL:https:\/\/teia\.art\/e\/1/)
    // Hidden event must not appear at all.
    assert.doesNotMatch(body, /Hidden Event/)
    assert.doesNotMatch(body, /chain-2@teia\.art/)
  } finally {
    global.fetch = realFetch
    delete process.env.CALENDAR_CONTRACT
  }
})

test('a failed IPFS fetch skips that event without breaking the feed', async () => {
  process.env.CALENDAR_CONTRACT = 'KT1TEST'
  stubFetch([
    [
      /\/bigmaps\/events\/keys/,
      [
        { key: '1', value: { current_cid: 'cidOk', hidden: false, version_count: '0' } },
        { key: '2', value: { current_cid: 'cidBad', hidden: false, version_count: '0' } },
      ],
    ],
    [/cidOk$/, { title: 'Good', startDate: '2026-08-01' }],
    // cidBad matches no route -> 404 -> that event is skipped.
  ])

  try {
    const res = await handler(new Request('http://localhost/calendar.ics'))
    const body = await res.text()
    assert.equal(res.status, 200)
    assert.equal((body.match(/BEGIN:VEVENT/g) || []).length, 1)
    assert.match(body, /SUMMARY:Good/)
  } finally {
    global.fetch = realFetch
    delete process.env.CALENDAR_CONTRACT
  }
})
