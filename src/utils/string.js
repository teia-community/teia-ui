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
