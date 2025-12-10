const prefixes = {
  tz1: new Uint8Array([6, 161, 159]),
  tz2: new Uint8Array([6, 161, 161]),
  tz3: new Uint8Array([6, 161, 164]),
  KT: new Uint8Array([2, 90, 121]),
  edpk: new Uint8Array([13, 15, 37, 217]),
}

const hex2buf = (hex: string) =>
  new Uint8Array(
    (hex.match(/[\da-f]{2}/gi) || []).map(function (h) {
      return parseInt(h, 16)
    })
  )

const b58cdecode = (enc: string, prefix: Uint8Array) => {
  return import('bs58check').then((bs58check) =>
    bs58check.decode(enc).slice(prefix.length)
  )
}

export const verify = async (bytes: string, sig: string, pk: string) => {
  const _sodium = await import('libsodium-wrappers')
  await _sodium.ready
  return _sodium.crypto_sign_verify_detached(
    sig as any,
    hex2buf(bytes),
    (await b58cdecode(pk, prefixes.edpk)) as any
  )
}
export default verify
