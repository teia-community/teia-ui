import { useMemo, useState } from 'react'
import base from 'base-x'
import styles from '@style'
import { HashToURL } from '@utils'
import { memo } from 'react'
import { Buffer } from 'buffer'

const alphabet58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
const base58 = base(alphabet58)

const s = 64

function bound(n, sq) {
  return Math.abs((sq - n) % sq)
}

function corner({ x, y }) {
  const d = 13
  const d2 = d * 2
  const s2 = s - d
  const q = s * 2 - d2
  return x + y < d || x + y > q || (x > s2 && y < d) || (y > s2 && x < d)
}

function newPath(path) {
  return path.substr(-2) !== 'M '
}

/**
 * Generates a random valid Tezos address
 * @returns {string} - The generated address in the format prefix + base58
 */
function dummyAddress() {
  // prefix options
  const prefixes = [
    { tag: 0, curve: 0, prefix: 'tz1' },
    { tag: 0, curve: 1, prefix: 'tz2' },
    { tag: 0, curve: 2, prefix: 'tz3' },
    { tag: 1, prefix: 'KT1' },
  ]
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)]

  // generate random 20-byte hash
  const hash = window.crypto.getRandomValues(new Uint8Array(20))

  // create a Uint8Array of length 22
  const addressArray = new Uint8Array(22)

  // set first byte as prefix.tag
  addressArray[0] = prefix.tag

  // if prefix.tag is 0, set second byte as prefix.curve
  if (prefix.tag === 0) {
    addressArray[1] = prefix.curve
  }

  // copy the hash into addressArray starting from the third byte
  addressArray.set(hash, prefix.tag === 0 ? 2 : 1)

  // if prefix.tag is 1, set last byte as 0
  if (prefix.tag === 1) {
    addressArray[21] = 0
  }

  // encode addressArray using Base58
  const base58Address = base58.encode(addressArray)
  const address = prefix.prefix + base58Address
  console.debug(`Random address: ${address}`)

  return address
}

/**
 * Generates an avatar based on a Tezos address
 * @param {string} [address] The Tezos address to generate the avatar for. If not provided, a dummy address will be used.
 * @return {array} An array containing the path and the sum of the avatar
 * @throws {Error} If the provided address is not a valid Tezos address
 */
function avatar(address) {
  address = address ? address : dummyAddress()
  const decoded = base58.decode(address.trim().substr(3))
  const hex = Buffer.from(decoded).toString('hex')
  const check = hex.split('').reduce((sum, x) => sum + parseInt(x, 16), 0)
  const sum = hex
    .split('')
    .slice(-5)
    .reduce((sum, x) => sum + parseInt(x, 16), 0)

  const xsb = []
  for (let i = 0; i < hex.length - 2; i++) {
    const n = parseInt(`${hex[i]}${hex[i + 1]}${hex[i + 2]}`, 16) + check
    const x = bound(Math.round((n || s / 2) / s), s)
    const y = bound(Math.round(n / (x || s / 2)), s)
    xsb.push({ x, y, n })
  }

  let path = 'M '
  let disk = false
  for (let i = 0; i < xsb.length; i++) {
    const n = xsb[i]
    if (newPath(path)) {
      if (corner(n) && n.n % 2 === 0 && (n.x + n.y) % 7 < 2) {
        const r = (n.x % 5) + (n.y % 7)
        path += `
          M ${bound(n.x + s / 10, s) - r}, ${bound(n.y + s / 10, s)}
          a ${r},${r} 0 1,0 ${r * 2},0
          a ${r},${r} 0 1,0 -${r * 2},0
        `
        disk = true
      } else if (n.n % 7 === 3) {
        const r = (n.x % 5) + (n.y % 7)
        path += `
          M ${bound(n.x + s / 10, s) - r}, ${bound(n.y + s / 10, s)}
          a ${r},${r} 0 1,0 ${r * 2},0
          a ${r},${r} 0 1,0 -${r * 2},0
        `
        disk = true
      } else if (n.n % 2 === 0 && n.x % 5 < 3) {
        path += ` M ${n.x},${n.y}`
        path += ` L ${n.x},${n.y}`
        disk = false
      } else if (n.n % 2 === 1) {
        path += ` M ${n.x},${n.y}`
        path += ` L ${n.y},${n.x}`
        disk = false
      } else {
        path += ` M ${n.x},${n.y}`
        path += ` L ${n.x},${n.y}`
        disk = false
        if (i < xsb.length - 2) {
          path += ` ${xsb[i + 1].x},${xsb[i + 1].y}`
          path += ` ${xsb[i + 2].x},${xsb[i + 2].y}`
        }
      }
    } else if (!disk) {
      path += ` ${n.x},${n.y}`
      disk = false
    } else {
      path += ` M ${n.x},${n.y}`
      path += ` L ${n.x},${n.y}`
      disk = false
    }
  }
  return [path, sum]
}

const identicons = [
  (path, _address) => (
    <svg viewBox={`0 0 ${s} ${s}`} xmlns="http://www.w3.org/2000/svg">
      <path id="path" d={`${path}`} />
    </svg>
  ),
  (path, address) => (
    <svg viewBox={`0 0 ${s} ${s}`} xmlns="http://www.w3.org/2000/svg">
      <filter
        id={`filter${address}`}
        x="0%"
        y="0%"
        width="100%"
        height="100%"
        filterUnits="objectBoundingBox"
        primitiveUnits="userSpaceOnUse"
      >
        <feMorphology
          operator="erode"
          radius="3 1"
          x="0%"
          y="0%"
          width="100%"
          height="100%"
          in="SourceGraphic"
          result="morphology"
        />
      </filter>
      <path
        id="path"
        d={`${path}`}
        style={{ filter: `url(#filter${address})` }}
      />
    </svg>
  ),
  (path, address) => (
    <svg viewBox={`0 0 ${s} ${s}`} xmlns="http://www.w3.org/2000/svg">
      <filter id={`filter${address}`}>
        <feTurbulence
          type="turbulence"
          baseFrequency="0.005"
          numOctaves="4"
          result="turbulence"
        />
        <feDisplacementMap
          in2="turbulence"
          in="SourceGraphic"
          scale="30"
          xChannelSelector="R"
          yChannelSelector="G"
        />
        <feMorphology operator="dilate" radius="0.5" />
        <feMorphology operator="erode" radius="0.5" />
      </filter>
      <path
        id="path"
        d={`${path}`}
        style={{ filter: `url(#filter${address})` }}
      />
    </svg>
  ),
  (path, address) => (
    <svg viewBox={`0 0 ${s} ${s}`} xmlns="http://www.w3.org/2000/svg">
      <filter id={`filter${address}`}>
        <feTurbulence
          type="turbulence"
          baseFrequency="0.005"
          numOctaves="4"
          result="turbulence"
        />
        <feDisplacementMap
          in2="turbulence"
          in="SourceGraphic"
          scale="50"
          xChannelSelector="R"
          yChannelSelector="G"
        />
        <feMorphology operator="erode" radius="0.5" />
      </filter>
      <path
        id="path"
        d={`${path}`}
        style={{ filter: `url(#filter${address})` }}
      />
    </svg>
  ),
  (path, address) => (
    <svg viewBox={`0 0 ${s} ${s}`} xmlns="http://www.w3.org/2000/svg">
      <filter id={`filter${address}`}>
        <feTurbulence
          type="turbulence"
          baseFrequency="0.5 0"
          numOctaves="1"
          result="turbulence"
        />
        <feDisplacementMap
          in2="turbulence"
          in="SourceGraphic"
          scale="10"
          xChannelSelector="R"
          yChannelSelector="G"
        />
      </filter>
      <path
        id="path"
        d={`${path}`}
        style={{ filter: `url(#filter${address})` }}
      />
    </svg>
  ),
  (path, address) => (
    <svg viewBox={`0 0 ${s} ${s}`} xmlns="http://www.w3.org/2000/svg">
      <filter id={`filter${address}`}>
        <feTurbulence
          type="turbulence"
          baseFrequency="0.05 0.5"
          numOctaves="1"
          result="turbulence"
        />
        <feDisplacementMap
          in2="turbulence"
          in="SourceGraphic"
          scale="10"
          xChannelSelector="R"
          yChannelSelector="G"
        />
      </filter>
      <path
        id="path"
        d={`${path}`}
        style={{ filter: `url(#filter${address})` }}
      />
    </svg>
  ),
  (path, address) => (
    <svg viewBox={`0 0 ${s} ${s}`} xmlns="http://www.w3.org/2000/svg">
      <filter id={`filter${address}`}>
        <feMorphology operator="erode" radius="1" />
      </filter>
      <path
        id="path"
        d={`${path}`}
        style={{ filter: `url(#filter${address})` }}
      />
    </svg>
  ),
  (path, address) => (
    <svg viewBox={`0 0 ${s} ${s}`} xmlns="http://www.w3.org/2000/svg">
      <filter id={`filter${address}`}>
        <feMorphology operator="dilate" radius="1.2" />
      </filter>
      <path
        id="path"
        d={`${path}`}
        style={{ filter: `url(#filter${address})` }}
      />
    </svg>
  ),
  (path, address) => (
    <svg viewBox={`0 0 ${s} ${s}`} xmlns="http://www.w3.org/2000/svg">
      <filter id={`filter${address}`} x="0" y="0" width="100%" height="100%">
        <feTile in="SourceGraphic" x="16" y="16" width="98" height="98" />
        <feTile />
      </filter>
      <path
        id="path"
        d={`${path}`}
        style={{ filter: `url(#filter${address})` }}
      />
    </svg>
  ),
  (path, address) => (
    <svg viewBox={`0 0 ${s} ${s}`} xmlns="http://www.w3.org/2000/svg">
      <filter id={`filter${address}`}>
        <feTurbulence
          type="turbulence"
          baseFrequency="0.05"
          numOctaves="2"
          result="turbulence"
        />
        <feDisplacementMap
          in2="turbulence"
          in="SourceGraphic"
          scale="20"
          xChannelSelector="R"
          yChannelSelector="G"
        />
      </filter>
      <path
        id="path"
        d={`${path}`}
        style={{ filter: `url(#filter${address})` }}
      />
    </svg>
  ),
]

export const Identicon = ({ address = '', logo }) => {
  const resolvedLogo = useMemo(() => {
    return logo ? HashToURL(logo, 'CDN', { size: 'medium' }) : ''
  }, [logo])

  const [isVideo, setIsVideo] = useState(false)

  if (resolvedLogo) {
    return isVideo ? (
      <div className={styles.identicon}>
        <video alt="identicon" src={resolvedLogo} />
      </div>
    ) : (
      <div className={styles.identicon}>
        <img
          src={resolvedLogo}
          alt="identicon"
          onError={() => setIsVideo(true)}
        />
      </div>
    )
  }

  const [path, xsa] = avatar(address)
  console.log({ path, xsa })
  const identicon = identicons[xsa % identicons.length](path, address)

  return <div className={styles.identicon}>{identicon}</div>
}

export default memo(Identicon)
