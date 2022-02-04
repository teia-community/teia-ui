export const getItem = (prop) => {
  let parsed
  try {
    parsed = JSON.parse(localStorage.getItem(prop))
  } catch (e) {
    parsed = null
  }
  return parsed
}

export const setItem = (prop, value) => {
  localStorage.setItem(prop, JSON.stringify(value))

  return getItem(prop)
}

export const removeItem = (prop) => {
  localStorage.removeItem(prop)
}
