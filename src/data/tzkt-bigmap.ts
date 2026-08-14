// Shared TzKT read helpers for the bigmap-backed contract registries
// (wiki, curations).
// WORK IN PROGRESS

export const TZKT_API = import.meta.env.VITE_TZKT_API

/** TzKT's maximum page size for bigmap key queries. */
export const MAX_PAGE_SIZE = 10000

/**
 * Fetch JSON from TzKT, throwing on a non-2xx response.
 *
 * Deliberately not `getTzktData` from `@data/api`: that helper logs the error
 * and resolves `undefined`, which SWR cannot tell apart from a successful
 * empty read — the registries need the throw to surface an error state.
 */
export async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`TzKT error: ${res.status}`)
  return res.json()
}
