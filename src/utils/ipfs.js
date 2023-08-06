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
