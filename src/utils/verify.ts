const prefixes = {
  tz1: new Uint8Array([6, 161, 159]),
  tz2: new Uint8Array([6, 161, 161]),
  tz3: new Uint8Array([6, 161, 164]),
  KT: new Uint8Array([2, 90, 121]),
  edpk: new Uint8Array([13, 15, 37, 217]),
}

const hex2buf = (hex: string) => {
  const match = hex.match(/[\da-f]{2}/gi)
  if (match)
    return new Uint8Array(
      match.map(function (h) {
        return parseInt(h, 16)
      })
    )
}
const b58cdecode = (enc: string, prefix: Uint8Array) => {
  return import('bs58check').then((bs58check) =>
    bs58check.decode(enc).slice(prefix.length)
  )
}

export const verify = async (bytes: string, sig, pk: string) => {
  const _sodium = await import('libsodium-wrappers')
  const sodium = await _sodium.await
  return sodium.crypto_sign_verify_detached(
    sig,
    hex2buf(bytes),
    b58cdecode(pk, prefixes.edpk)
  )
}
export default verify
