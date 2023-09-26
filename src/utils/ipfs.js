import axios from 'axios'
import { CIDToURL } from '@utils/index'

// Downloads a json file from ipfs
export async function downloadJsonFileFromIpfs(cid) {
  const response = await fetch(CIDToURL(cid))

  if (!response.ok) {
    console.error(
      `There was a problem downloading a file from ipfs with cid ${cid}`
    )
  }

  return response.json()
}

// Uploads a file to the ipfs proxy
export async function uploadFileToIPFSProxy(file) {
  const form_data = new FormData()
  form_data.append('asset', file)
  const response = await axios.post(
    `${import.meta.env.VITE_IPFS_UPLOAD_PROXY}/single`,
    form_data,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  )

  return response
}
