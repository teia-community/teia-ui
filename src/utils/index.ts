import { NFT } from '@types'
import * as _ from 'lodash'

export function rnd(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1) + min)
}

/**
 *
 * @param
 * @returns
 */
export function shuffle(a: [string]) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/**
 * A very basic random with seed
 * @param {number} seed
 * @returns
 */
export function randomSeed(seed: number) {
  let s = Math.sin(seed) * 1e4
  return (s -= Math.floor(s))
}

export const fetchJSON = async (url: string) => {
  try {
    return await fetch(url).then(async (res) => await res.json())
  } catch (err) {
    console.error(err)
  }
}

type IPFSGateway =
  | 'CDN'
  | 'CLOUDFLARE'
  | 'PINATA'
  | 'IPFS'
  | 'DWEB'
  | 'NFTSTORAGE'

interface CIDtoURLOptions {
  size: 'raw' | 'small' | 'medium'
}

const CIDToURL = (
  cid: string,
  type: IPFSGateway = import.meta.env.VITE_IPFS_DEFAULT_GATEWAY,
  options: CIDtoURLOptions
): string => {
  if (cid == null) {
    return ''
  }
  if (type !== 'CDN' && !_.isEmpty(options)) {
    console.warn('Using options for IPFS Gateways does nothing')
  }

  switch (type) {
    case 'CDN':
      return `https://cache.teia.rocks/media/${
        options.size || 'raw'
      }/ipfs/${cid}`
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

/**
 * Converts an ipfs hash to ipfs url
 * @param {string} hash
 * @param {'CDN' | 'CLOUDFLARE' | 'PINATA' | 'IPFS' | 'DWEB' | 'NFTSTORAGE'} type
 * @param {HashToURLOptions} [options]
 * @returns {string}
 */
export const HashToURL = (
  hash: string,
  type = import.meta.env.VITE_IPFS_DEFAULT_GATEWAY,
  options: CIDtoURLOptions = { size: 'raw' }
) => {
  // when on preview the hash might be undefined.
  // its safe to return empty string as whatever called HashToURL is not going to be used
  // artifactUri or displayUri
  if (hash == null) {
    return ''
  }

  const CID = hash.split('ipfs://')[1]
  return CIDToURL(CID, type, options)
}

export function formatRoyalties(nft: NFT) {
  const royalties = _.get(nft, 'royalty_receivers.0.royalties')

  if (!_.isNumber(royalties)) {
    return '-'
  }

  return `${royalties / 10000}%`
}
