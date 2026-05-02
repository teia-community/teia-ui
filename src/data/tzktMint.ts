import axios from 'axios'
import { HEN_CONTRACT_FA2, MARKETPLACE_CONTRACT_V1 } from '@constants'

export type FetchMintedTokenIdParams = {
  minterAddress: string
  /** Epoch ms before `mint()` was invoked (buffer for clock skew). */
  mintStartedAtMs: number
  /** Editions minted (FA2 transfer amount should match). */
  expectedEditions: number
}

type TzktTokenTransfer = {
  timestamp: string
  amount: string
  from?: { address?: string }
  to?: { address?: string }
  token?: { tokenId?: string; contract?: { address?: string } }
}

const baseUrl = () => import.meta.env.VITE_TZKT_API.replace(/\/$/, '')

function parseTsMs(iso: string): number {
  const t = Date.parse(iso)
  return Number.isNaN(t) ? 0 : t
}

/**
 * Poll TzKT token transfers for a fresh FA2 mint to `minterAddress` on H=N contract.
 * Mints typically appear as a transfer with no `from` (mint credit) to the minter.
 */
export async function fetchMintedTokenIdWithRetry(
  params: FetchMintedTokenIdParams,
  options?: {
    maxAttempts?: number
    initialDelayMs?: number
    maxDelayMs?: number
  }
): Promise<string | null> {
  const maxAttempts = options?.maxAttempts ?? 25
  const initialDelayMs = options?.initialDelayMs ?? 400
  const maxDelayMs = options?.maxDelayMs ?? 4000

  const { minterAddress, mintStartedAtMs, expectedEditions } = params
  const expectedAmount = String(expectedEditions)

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (attempt > 0) {
      const delay = Math.min(
        maxDelayMs,
        Math.floor(initialDelayMs * Math.pow(1.35, attempt - 1))
      )
      await new Promise((r) => setTimeout(r, delay))
    }

    try {
      const { data } = await axios.get<TzktTokenTransfer[]>(
        `${baseUrl()}/v1/tokens/transfers`,
        {
          params: {
            'token.contract': HEN_CONTRACT_FA2,
            'to.eq': minterAddress,
            'sort.desc': 'id',
            limit: 40,
          },
          timeout: 15000,
        }
      )

      if (!Array.isArray(data)) {
        continue
      }

      const cutoffMs = mintStartedAtMs - 15_000

      for (const row of data) {
        if (row.token?.contract?.address !== HEN_CONTRACT_FA2) {
          continue
        }
        if (row.to?.address?.toLowerCase() !== minterAddress.toLowerCase()) {
          continue
        }
        const fromAddr = row.from?.address
        // Mint credit: no sender, or transfer from HEN v1 minter contract.
        if (
          fromAddr &&
          fromAddr !== MARKETPLACE_CONTRACT_V1 &&
          fromAddr !== HEN_CONTRACT_FA2
        ) {
          continue
        }
        if (row.amount !== expectedAmount) {
          continue
        }
        if (parseTsMs(row.timestamp) < cutoffMs) {
          continue
        }
        const id = row.token?.tokenId
        if (id != null && id !== '') {
          return String(id)
        }
      }
    } catch (e) {
      console.warn('TzKT mint token lookup failed', e)
    }
  }

  return null
}
