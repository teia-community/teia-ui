export function rnd(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min)
}

export function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export const fetchJSON = async (url) => {
  try {
    return await fetch(url).then(async (res) => await res.json())
  } catch (err) {
    console.error(err)
  }
}

export const CIDToURL = (
  cid,
  type = process.env.REACT_APP_IPFS_DEFAULT_GATEWAY
) => {
  if (cid == null) {
    return ''
  }
  switch (type) {
    case 'HIC':
      return `https://pinata.hicetnunc.xyz/ipfs/${cid}`
    case 'CLOUDFLARE':
      return `https://cloudflare-ipfs.com/ipfs/${cid}`
    case 'PINATA':
      return `https://gateway.pinata.cloud/ipfs/${cid}`
    case 'IPFS':
      return `https://ipfs.io/ipfs/${cid}`
    case 'DWEB':
      return `http://dweb.link/ipfs/${cid}`
    case 'NFTSTORAGE':
      return `https://nftstorage.link/ipfs/${cid}`

    default:
      console.error('please specify type')
      return cid
  }
}

// converts an ipfs hash to ipfs url
export const HashToURL = (
  hash,
  type = process.env.REACT_APP_IPFS_DEFAULT_GATEWAY
) => {
  // when on preview the hash might be undefined.
  // its safe to return empty string as whatever called HashToURL is not going to be used
  // artifactUri or displayUri
  if (hash == null) {
    return ''
  }

  switch (type) {
    case 'HIC':
      return hash.replace('ipfs://', 'https://pinata.hicetnunc.xyz/ipfs/')
    case 'CLOUDFLARE':
      return hash.replace('ipfs://', 'https://cloudflare-ipfs.com/ipfs/')
    case 'PINATA':
      return hash.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/')
    case 'IPFS':
      return hash.replace('ipfs://', 'https://ipfs.io/ipfs/')
    case 'DWEB':
      return hash.replace('ipfs://', 'http://dweb.link/ipfs/')
    case 'NFTSTORAGE':
      return hash.replace('ipfs://', 'https://nftstorage.link/ipfs/')

    default:
      console.error('please specify type')
      return hash
  }
}
