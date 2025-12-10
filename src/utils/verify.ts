const prefixes = {
  tz1: new Uint8Array([6, 161, 159]),
  tz2: new Uint8Array([6, 161, 161]),
  tz3: new Uint8Array([6, 161, 164]),
  KT: new Uint8Array([2, 90, 121]),
  edpk: new Uint8Array([13, 15, 37, 217]),
}

const hex2buf = (hex) =>
  new Uint8Array(
    hex.match(/[\da-f]{2}/gi).map(function (h) {
      return parseInt(h, 16)
    })
  )

const b58cdecode = (enc, prefix) => {
  return import('bs58check').then((bs58check) =>
    bs58check.decode(enc).slice(prefix.length)
  )
}

export const verify = async (bytes, sig, pk) => {
  const _sodium = await import('libsodium-wrappers')
  const sodium = await _sodium.await
  return sodium.crypto_sign_verify_detached(
    sig,
    hex2buf(bytes),
    b58cdecode(pk, prefixes.edpk)
  )
}
export default verify
