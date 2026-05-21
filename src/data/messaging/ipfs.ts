import axios from 'axios'

const MSG_IPFS_PROXY =
  import.meta.env.VITE_IPFS_MSG_UPLOAD_PROXY || 'https://ipfsmsg.teia.art'

const FALLBACK_GATEWAYS = [
  `${MSG_IPFS_PROXY}/ipfs/`,
  'https://ipfs.io/ipfs/',
  'https://cloudflare-ipfs.com/ipfs/',
]

const MAX_UPLOAD_RETRIES = 2
const RETRY_DELAY_MS = 1000

/**
 * Convert an ipfs:// URI to an HTTP gateway URL
 * using the messaging IPFS proxy as primary gateway.
 */
export function msgIpfsToUrl(uri: string): string {
  const cid = uri.replace('ipfs://', '')
  return `${MSG_IPFS_PROXY}/ipfs/${cid}`
}

/**
 * Fetch JSON from IPFS with gateway fallback.
 * Tries the messaging proxy first, then public gateways.
 */
export async function fetchMsgIpfsJson<T>(uri: string): Promise<T> {
  const cid = uri.replace('ipfs://', '')

  for (const gateway of FALLBACK_GATEWAYS) {
    try {
      const res = await fetch(`${gateway}${cid}`)
      if (res.ok) {
        return (await res.json()) as T
      }
    } catch {
      // try next gateway
    }
  }

  throw new Error(`IPFS fetch failed for ${uri}: all gateways exhausted`)
}

/**
 * Upload a file to the messaging IPFS proxy.
 * Returns the raw CID string.
 * Retries up to MAX_UPLOAD_RETRIES times on failure.
 */
export async function uploadMsgFileToIPFS(
  file: File,
): Promise<string> {
  const form = new FormData()
  form.append('asset', file)

  let lastError: Error | undefined

  for (let attempt = 0; attempt <= MAX_UPLOAD_RETRIES; attempt++) {
    try {
      const res = await axios.post(`${MSG_IPFS_PROXY}/single`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return res.data.cid
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err))
      if (attempt < MAX_UPLOAD_RETRIES) {
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS * (attempt + 1)))
      }
    }
  }

  throw new Error(
    `IPFS upload failed after ${MAX_UPLOAD_RETRIES + 1} attempts: ${lastError?.message}`
  )
}

/**
 * Upload a JSON object to the messaging IPFS proxy.
 * Returns the full ipfs:// URI.
 */
export async function uploadMsgJsonToIPFS(
  data: Record<string, unknown> | unknown[],
): Promise<string> {
  const blob = new Blob([JSON.stringify(data)], {
    type: 'application/json',
  })
  const file = new File([blob], 'metadata.json', {
    type: 'application/json',
  })
  const cid = await uploadMsgFileToIPFS(file)
  return `ipfs://${cid}`
}
