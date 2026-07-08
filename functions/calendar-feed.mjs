import { buildICS } from '../src/utils/ics.mjs'

const CONCURRENCY = 8

// Mainnet teiaCalendar contract (public, on-chain), mirrored from
// CALENDAR_CONTRACT in src/constants.ts (a Netlify function can't import that
// TS module — it would drag in the Vite app's module graph).
const CONTRACT = 'KT1FER3RWZxJtrwcYouvZzU4bGA8fBUSGppy'

function isHidden(value) {
  return value?.hidden === true || value?.hidden === 'true'
}

async function fetchJson(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

/**
 * Fetch a CID's JSON, trying each gateway in order (mirrors the client-side
 * fetchMsgIpfsJson in src/data/messaging/ipfs.ts). Calendar event CIDs are
 * pinned on the MSG IPFS proxy, the same as wiki pages.
 */
async function fetchIpfsJson(cid, gateways) {
  const bare = String(cid || '').replace(/^ipfs:\/\//, '')
  for (const gateway of gateways) {
    try {
      const res = await fetch(`${gateway}${bare}`)
      if (res.ok) return res.json()
    } catch {
      // try the next gateway
    }
  }
  throw new Error(`IPFS fetch failed for ${cid}: all gateways exhausted`)
}

/** Run `items` through `fn` with bounded concurrency, tolerating per-item failures. */
async function mapWithConcurrency(items, concurrency, fn) {
  const results = []
  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency)
    const settled = await Promise.allSettled(batch.map(fn))
    results.push(...settled)
  }
  return results
}

export default async (req) => {
  const tzktBase = process.env.CALENDAR_TZKT_BASE || 'https://api.tzkt.io'
  // Read gateways, primary first. Mirrors FALLBACK_GATEWAYS in
  // src/data/messaging/ipfs.ts (event CIDs are pinned on the MSG IPFS proxy).
  // Server-side, so no import.meta.env.VITE_*; CALENDAR_IPFS_GATEWAY
  // (process.env) overrides the primary gateway.
  const ipfsGateways = [
    process.env.CALENDAR_IPFS_GATEWAY || 'https://ipfsmsg.teia.art/ipfs/',
    'https://ipfs.io/ipfs/',
    'https://gateway.pinata.cloud/ipfs/',
  ]

  const headers = {
    'Content-Type': 'text/calendar; charset=utf-8',
    'Content-Disposition': 'inline; filename="teia-community-calendar.ics"',
    'Cache-Control':
      'public, max-age=0, s-maxage=1800, stale-while-revalidate=86400',
  }

  const dtstamp = new Date().toISOString()

  let keys = []
  try {
    const url = `${tzktBase}/v1/contracts/${CONTRACT}/bigmaps/events/keys?active=true&limit=10000&select=key,value`
    keys = await fetchJson(url)
  } catch {
    keys = []
  }

  const active = (keys || []).filter((entry) => !isHidden(entry.value))

  const settled = await mapWithConcurrency(active, CONCURRENCY, async (entry) => {
    const cid = entry.value?.current_cid
    const json = await fetchIpfsJson(cid, ipfsGateways)
    // One malformed document must only drop its own event, never the feed:
    // throwing here lands in this entry's allSettled slot and it's skipped.
    if (!/^\d{4}-\d{2}-\d{2}/.test(String(json?.startDate ?? ''))) {
      throw new Error(`invalid startDate for event ${entry.key}`)
    }
    return {
      uid: `chain-${entry.key}@teia.art`,
      sequence: Number(entry.value?.version_count) || 0,
      title: json.title,
      start: json.startDate,
      end: json.endDate || undefined,
      description: json.description,
      location: json.location,
      url: json.links?.[0]?.url,
      recurrence: json.recurrence,
    }
  })

  const events = settled
    .filter((r) => r.status === 'fulfilled')
    .map((r) => r.value)

  const body = buildICS({
    events,
    dtstamp,
    calName: 'Teia Community Calendar',
  })

  return new Response(body, { headers })
}
