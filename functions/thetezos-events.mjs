import { fetchThetezosEvents } from '../src/data/calendar/thetezos.mjs'

// Serve at /api/thetezos-events. A function route beats the SPA catch-all
// (public/_redirects `/*`). Holds the secret MEC token server-side so it never
// reaches the client bundle.
export const config = { path: '/api/thetezos-events' }

const DEFAULT_LIMIT = 100

const json = (body, status = 200, extra = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...extra },
  })

export default async (req) => {
  const token = process.env.MEC_TOKEN
  if (!token) {
    return json({ events: [], error: 'MEC_TOKEN is not configured' }, 500)
  }
  const params = new URL(req.url).searchParams
  const limit = Number(params.get('limit')) || DEFAULT_LIMIT
  const past = params.get('past') === '1'
  try {
    const events = await fetchThetezosEvents(token, { limit, past })
    return json({ events }, 200, {
      'Cache-Control':
        'public, max-age=0, s-maxage=900, stale-while-revalidate=3600',
    })
  } catch (e) {
    // A source failure means no WP events, never a broken calendar.
    return json({ events: [], error: String(e?.message || e) }, 502)
  }
}
