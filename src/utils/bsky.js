import axios from 'axios'
import { verifySignature, getPkhfromPk } from '@taquito/utils'

// Resolve a Tezos wallet address to a verified Bluesky (atproto) identity.
//
// tzbsky's index is used only to *discover* a candidate DID; trust comes
// from the signed record in the DID's own atproto repo, which we fetch and
// verify ourselves. A wrong/malicious index can only point at a different
// DID whose repo will not contain a wallet-signed binding for this address,
// so verification fails closed.

const TZBSKY_API = import.meta.env.VITE_TZBSKY_API || 'https://tzbsky.com'
const PLC_DIRECTORY =
  import.meta.env.VITE_PLC_DIRECTORY || 'https://plc.directory'
const BSKY_PUBLIC_API =
  import.meta.env.VITE_BSKY_PUBLIC_API || 'https://public.api.bsky.app'

const COLLECTION = 'com.tzbsky.cryptoAddress'

const toHex = (bytes) =>
  Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')

// Micheline PACK of a string value: 0x05 0x01 <4-byte BE length> <utf8 bytes>.
// @taquito's verifySignature blake2b-256 hashes this and verifies the curve
// signature, so we only need to reproduce the packed payload as hex.
const packMichelineString = (message) => {
  const utf8 = new TextEncoder().encode(message)
  const len = utf8.length
  const be32 = new Uint8Array([
    (len >>> 24) & 0xff,
    (len >>> 16) & 0xff,
    (len >>> 8) & 0xff,
    len & 0xff,
  ])
  // 0x05 = PACK magic byte, 0x01 = Micheline string tag
  return '0501' + toHex(be32) + toHex(utf8)
}

const parseMessageFields = (message) => {
  const fields = {}
  for (const line of message.split('\n')) {
    const eq = line.indexOf('=')
    if (eq > 0) fields[line.slice(0, eq).trim()] = line.slice(eq + 1).trim()
  }
  return fields
}

// address -> candidate DID (untrusted discovery hint).
const lookupDid = async (address) => {
  const { data } = await axios.get(
    `${TZBSKY_API}/api/lookup/address/tezos/${address}`
  )
  return data?.did || null
}

// DID -> PDS service endpoint (where the repo lives).
const resolvePds = async (did) => {
  let doc
  if (did.startsWith('did:plc:')) {
    doc = (await axios.get(`${PLC_DIRECTORY}/${did}`)).data
  } else if (did.startsWith('did:web:')) {
    const rest = did.slice('did:web:'.length).split(':')
    const domain = decodeURIComponent(rest[0])
    const path =
      rest.length > 1
        ? `/${rest.slice(1).map(decodeURIComponent).join('/')}/did.json`
        : '/.well-known/did.json'
    doc = (await axios.get(`https://${domain}${path}`)).data
  } else {
    return null
  }
  const service = (doc?.service || []).find(
    (s) =>
      s.type === 'AtprotoPersonalDataServer' ||
      (typeof s.id === 'string' && s.id.endsWith('#atproto_pds'))
  )
  return service?.serviceEndpoint || null
}

const fetchRecord = async (pds, did) => {
  const { data } = await axios.get(`${pds}/xrpc/com.atproto.repo.getRecord`, {
    params: { repo: did, collection: COLLECTION, rkey: 'self' },
  })
  return data?.value || null
}

// DID -> current handle. Display-only: the handle is mutable and is not part
// of the proof, so it is resolved fresh and never treated as the identity.
const resolveHandle = async (did) => {
  const { data } = await axios.get(
    `${BSKY_PUBLIC_API}/xrpc/app.bsky.actor.getProfile`,
    { params: { actor: did } }
  )
  return data?.handle || null
}

// Both checks are mandatory:
//  1. binding   - the signed message names *this* repo's DID and *this*
//                 address, so a signature lifted from elsewhere cannot be
//                 replayed into another repo.
//  2. signature - the wallet key signed that exact message, and that key
//                 derives the address being looked up.
const verifyEntry = (entry, did, address) => {
  if (!entry || entry.chain !== 'tezos') return false
  if (entry.address !== address) return false

  const proof = entry.proof
  if (!proof || proof.scheme !== 'tezos-micheline') return false
  if (!proof.message || !proof.signature || !entry.publicKey) return false

  const fields = parseMessageFields(proof.message)
  if (fields.did !== did) return false
  if (fields.address !== address) return false
  if (fields.chain !== 'tezos') return false

  let derived
  try {
    derived = getPkhfromPk(entry.publicKey)
  } catch {
    return false
  }
  if (derived !== address) return false

  try {
    return verifySignature(
      packMichelineString(proof.message),
      entry.publicKey,
      proof.signature
    )
  } catch {
    return false
  }
}

// Returns { did, handle } only if the address ↔ DID link verifies, else null.
// Never throws; any network or verification failure yields null so the UI
// simply omits the link. Do not cache the result — there is no cryptographic
// revocation, so the current record is authoritative on each load.
export const resolveVerifiedBluesky = async (address) => {
  try {
    if (!address) return null

    const did = await lookupDid(address)
    if (!did) return null

    const pds = await resolvePds(did)
    if (!pds) return null

    const record = await fetchRecord(pds, did)
    const entry = (record?.addresses || []).find((e) => e.chain === 'tezos')
    if (!verifyEntry(entry, did, address)) return null

    const handle = await resolveHandle(did)
    if (!handle) return null

    return { did, handle }
  } catch {
    return null
  }
}
