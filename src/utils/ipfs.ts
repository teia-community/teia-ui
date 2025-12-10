import { CIDToURL } from '@utils/index'

// Downloads a json file from ipfs
export async function downloadJsonFileFromIpfs(cid: string) {
  const response = await fetch(CIDToURL(cid, 'IPFS', { size: 'raw' }))

  if (!response.ok) {
    console.error(
      `There was a problem downloading a file from ipfs with cid ${cid}`
    )
  }

  return response.json()
}

// Uploads a file to the ipfs proxy
export async function uploadFileToIPFSProxy(file: File) {
  const form_data = new FormData()
  form_data.append('asset', file)
  const response = await fetch(
    `${import.meta.env.VITE_IPFS_UPLOAD_PROXY}/single`,
    {
      method: 'POST',
      body: form_data,
    }
  )

  const data = await response.json()
  return data.cid
}
