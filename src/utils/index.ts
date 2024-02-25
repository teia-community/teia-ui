import { NFT } from '@types'
import * as _ from 'lodash'
import { useLocalSettings } from '@context/localSettingsStore'
import { shallow } from 'zustand/shallow'

/** Flip key value to value key */
export const flipObject = <T>(obj: { [key: string]: T }) =>
  Object.fromEntries(Object.entries(obj).map((pair) => pair.reverse()))

export function rnd(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1) + min)
}

export function shuffle(a: string[]) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/**
 * A very basic random with seed
 */
export function randomSeed(seed: number) {
  let s = Math.sin(seed) * 1e4
  return (s -= Math.floor(s))
}

export const CIDToURL = (cid: string, type: string): string => {
  const [ipfsGateway] = useLocalSettings(
    (state) => [state.getIpfsGateway()],
    shallow
  )
  if (cid == null) {
    return ''
  }

  switch (type) {
    case 'CDN':
      return `https://cache.teia.art/ipfs/${cid}`
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
    case 'NATIVE':
      return `ipfs://${cid}`
    default: {
      if (ipfsGateway) {
        return ipfsGateway + cid
      }
      console.error('please specify type')
      return cid
    }
  }
}

/**
 * Converts an ipfs hash to ipfs url
 * @param {string} hash
 * @param {string}  type
 * @returns {string}
 */
export const HashToURL = (hash: string, type: string) => {
  // when on preview the hash might be undefined.
  // its safe to return empty string as whatever called HashToURL is not going to be used
  // artifactUri or displayUri
  if (hash == null) {
    return ''
  }

  const CID = hash.split('ipfs://')[1]
  return CIDToURL(CID, type)
}

export function formatRoyalties(nft: NFT) {
  const royalties = _.get(nft, 'royalty_receivers.0.royalties')

  if (!_.isNumber(royalties)) {
    return '-'
  }

  return `${royalties / 10000}%`
}
