export const walletPreview = (wallet?: string | null) => {
  if (!wallet) return ''
  try {
    return `${wallet.slice(0, 5)}...${wallet.slice(
      wallet.length - 5,
      wallet.length
    )}`
  } catch (e) {
    return ''
  }
}

export const capitalizeFirstLetter = (word: string) => {
  return word[0].toUpperCase() + word.slice(1)
}
