import { request } from 'graphql-request'

const ENDPOINT = import.meta.env.VITE_TEIA_GRAPHQL_API

export function keysetAfter(cursor, last) {
  return {
    _or: cursor.map((field, i) => ({
      ...Object.fromEntries(
        cursor.slice(0, i).map((g) => [g, { _eq: last[g] }])
      ),
      [field]: { _gt: last[field] },
    })),
  }
}

export async function fetchAll(
  query,
  key,
  baseWhere,
  cursor,
  { pageSize = 500, onProgress } = {}
) {
  const rows = []
  let last = null
  for (;;) {
    const where = last
      ? { _and: [baseWhere, keysetAfter(cursor, last)] }
      : baseWhere
    const res = await request(ENDPOINT, query, { where, limit: pageSize })
    const page = res[key] || []
    rows.push(...page)
    onProgress?.(rows.length)
    if (page.length < pageSize) return rows
    last = page[page.length - 1]
  }
}
