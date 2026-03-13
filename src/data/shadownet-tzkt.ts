/**
 * TzKT API utilities for Shadownet.
 */

const SHADOWNET_TZKT_API =
  import.meta.env.VITE_SHADOWNET_TZKT_API || 'https://api.shadownet.tzkt.io'

export async function fetchContractStorage<T = unknown>(
  contractAddress: string
): Promise<T> {
  const res = await fetch(
    `${SHADOWNET_TZKT_API}/v1/contracts/${contractAddress}/storage`
  )
  if (!res.ok) throw new Error(`TzKT error: ${res.status}`)
  return res.json()
}

export async function fetchBigMapValue<V = unknown>(
  contractAddress: string,
  bigmapName: string,
  key: string
): Promise<V | null> {
  const res = await fetch(
    `${SHADOWNET_TZKT_API}/v1/contracts/${contractAddress}/bigmaps/${bigmapName}/keys/${key}`
  )
  if (!res.ok) {
    if (res.status === 404) return null
    throw new Error(`TzKT error: ${res.status}`)
  }
  const data = await res.json()
  return data.value ?? null
}

export async function fetchBigMapKeys<V = unknown>(
  bigmapId: number,
  params?: Record<string, string>
): Promise<{ key: string; value: V }[]> {
  const searchParams = new URLSearchParams({
    active: 'true',
    select: 'key,value',
    ...params,
  })
  const res = await fetch(
    `${SHADOWNET_TZKT_API}/v1/bigmaps/${bigmapId}/keys?${searchParams}`
  )
  if (!res.ok) throw new Error(`TzKT error: ${res.status}`)
  return res.json()
}
