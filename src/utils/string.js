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

/**
 * Transforms a string to hex bytes
 */
export function stringToHex(str) {
  return Array.from(str).reduce(
    (hex, c) => (hex += c.charCodeAt(0).toString(16).padStart(2, '0')),
    ''
  )
}

/**
 * Transforms some hex bytes to a string
 */
export function hexToString(hex) {
  return hex
    .match(/.{1,2}/g)
    .reduce((acc, char) => acc + String.fromCharCode(parseInt(char, 16)), '')
}
