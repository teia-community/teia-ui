/**
 * IPFS helpers for the messaging system.
 * Uses the dedicated messaging IPFS proxy (VITE_IPFS_MSG_UPLOAD_PROXY)
 * for both uploads and reads, instead of the NFT pinning proxy.
 */
import axios from 'axios'
import { useModalStore } from '@context/modalStore'

const MSG_IPFS_PROXY = import.meta.env.VITE_IPFS_MSG_UPLOAD_PROXY

/**
 * Convert an `ipfs://` URI to an HTTP URL via the messaging proxy.
 */
export function msgIpfsToUrl(uri: string): string {
  const cid = uri.replace('ipfs://', '')
  return `${MSG_IPFS_PROXY}/ipfs/${cid}`
}

/**
 * Fetch JSON from an `ipfs://` URI via the messaging proxy,
 * falling back to public gateways.
 */
export async function fetchMsgIpfsJson<T>(uri: string): Promise<T> {
  const cid = uri.replace('ipfs://', '')

  const gateways = [
    `${MSG_IPFS_PROXY}/ipfs/${cid}`,
    `https://ipfs.io/ipfs/${cid}`,
    `https://cloudflare-ipfs.com/ipfs/${cid}`,
  ]

  for (const url of gateways) {
    try {
      const res = await fetch(url)
      if (res.ok) return res.json()
    } catch {
      // try next gateway
    }
  }
  throw new Error(`IPFS fetch failed for ${uri}: all gateways exhausted`)
}

/**
 * Upload a raw File to the messaging IPFS proxy, returns the CID.
 */
export async function uploadMsgFileToIPFS(
  file: File,
  title: string
): Promise<string> {
  const step = useModalStore.getState().step

  if (!MSG_IPFS_PROXY) {
    throw new Error('VITE_IPFS_MSG_UPLOAD_PROXY is not configured')
  }

  step(title, `Uploading ${file.name} to IPFS`)

  const form = new FormData()
  form.append('asset', file)

  const res = await axios.post(`${MSG_IPFS_PROXY}/single`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })

  return res.data.cid
}

/**
 * Upload a JSON object to the messaging IPFS proxy, returns `ipfs://CID`.
 */
export async function uploadMsgJsonToIPFS(
  data: Record<string, unknown>,
  title: string
): Promise<string> {
  const blob = new Blob([JSON.stringify(data)], { type: 'application/json' })
  const file = new File([blob], 'metadata.json', { type: 'application/json' })
  const cid = await uploadMsgFileToIPFS(file, title)
  return `ipfs://${cid}`
}
