export const walletPreview = (wallet) => {
  try {
    return `${wallet.slice(0, 5)}...${wallet.slice(
      wallet.length - 5,
      wallet.length
    )}`
  } catch (e) {
    return ''
  }
}

export const capitalizeFirstLetter = (word) => {
  return word[0].toUpperCase() + word.slice(1)
}

export const isTzAddress = (val) =>
  typeof val === 'string' &&
  /^tz[1-3][1-9A-HJ-NP-Za-km-z]{33}$/.test(val.trim())

/** Collapse whitespace and truncate to a single line preview snippet. */
export const preview = (text, len = 90) => {
  const t = (text ?? '').replace(/\s+/g, ' ').trim()
  return t.length > len ? t.slice(0, len) + '…' : t || '(empty)'
}
