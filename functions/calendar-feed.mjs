import { buildICS } from '../src/utils/ics.mjs'

const CONCURRENCY = 8

// Mainnet teiaCalendar contract (public, on-chain). Committed as the default so
// the feed works with no dashboard config; override via the CALENDAR_CONTRACT
// env var to point a deploy preview at a testnet instance.
const DEFAULT_CONTRACT = 'KT1FER3RWZxJtrwcYouvZzU4bGA8fBUSGppy'

function isHidden(value) {
  return value?.hidden === true || value?.hidden === 'true'
}

function ipfsUrl(gateway, cid) {
  return gateway + String(cid || '').replace(/^ipfs:\/\//, '')
}

async function fetchJson(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
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
  const contract = process.env.CALENDAR_CONTRACT || DEFAULT_CONTRACT
  const tzktBase = process.env.CALENDAR_TZKT_BASE || 'https://api.tzkt.io'
  const ipfsGateway =
    process.env.CALENDAR_IPFS_GATEWAY || 'https://cache.teia.rocks/ipfs/'

  const headers = {
    'Content-Type': 'text/calendar; charset=utf-8',
    'Content-Disposition': 'inline; filename="teia-community-calendar.ics"',
    'Cache-Control':
      'public, max-age=0, s-maxage=1800, stale-while-revalidate=86400',
  }

  const dtstamp = new Date().toISOString()

  if (!contract) {
    return new Response(
      buildICS({ events: [], dtstamp, calName: 'Teia Community Calendar' }),
      { headers }
    )
  }

  let keys = []
  try {
    const url = `${tzktBase}/v1/contracts/${contract}/bigmaps/events/keys?active=true&limit=10000&select=key,value`
    keys = await fetchJson(url)
  } catch {
    keys = []
  }

  const active = (keys || []).filter((entry) => !isHidden(entry.value))

  const settled = await mapWithConcurrency(active, CONCURRENCY, async (entry) => {
    const cid = entry.value?.current_cid
    const json = await fetchJson(ipfsUrl(ipfsGateway, cid))
    return {
      uid: `chain-${entry.key}@teia.art`,
      sequence: Number(entry.value?.version_count) || 0,
      title: json.title,
      start: json.startDate,
      end: json.endDate || undefined,
      description: json.description,
      location: json.location,
      url: json.links?.[0]?.url,
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
