// One door for every TzKT request.
//
// TzKT rate-limits anonymous callers, and a page like the DAO asks it a lot of
// questions at once: proposals, votes, members, balances, the fees of eight
// contracts. Fired all at once they tripped the limit, and a single 429 ended
// the page with "TzKT error: 429" rather than with a list.
//
// So requests queue a few at a time, and one that is turned away waits and
// asks again instead of failing the page.

import { shouldRetry, retryDelay, apiErrorMessage } from '@utils/rate-limit.mjs'

/** Enough to stay quick, few enough to stay under the limit. */
const MAX_PARALLEL = 4
const MAX_ATTEMPTS = 4

let active = 0
const waiting: (() => void)[] = []

function takeSlot(): Promise<void> {
  if (active < MAX_PARALLEL) {
    active += 1
    return Promise.resolve()
  }
  return new Promise((resolve) => waiting.push(resolve))
}

function freeSlot() {
  const next = waiting.shift()
  // Hand the slot straight on rather than releasing and re-taking it.
  if (next) next()
  else active -= 1
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/** Fetch a TzKT url, queued and retried, and return the parsed body. */
export async function tzktFetch<T>(url: string): Promise<T> {
  for (let attempt = 0; ; attempt += 1) {
    await takeSlot()
    let res: Response
    try {
      res = await fetch(url)
    } finally {
      freeSlot()
    }

    if (res.ok) return res.json() as Promise<T>

    const last = attempt + 1 >= MAX_ATTEMPTS
    if (last || !shouldRetry(res.status)) {
      throw new Error(apiErrorMessage(res.status))
    }
    await sleep(retryDelay(attempt, res.headers.get('retry-after')))
  }
}

export default tzktFetch
