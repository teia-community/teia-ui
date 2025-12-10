export const getItem = (prop: string) => {
  let parsed
  try {
    const item = localStorage.getItem(prop)
    parsed = item ? JSON.parse(item) : null
  } catch (e) {
    parsed = null
  }
  return parsed
}

export const setItem = (prop: string, value: any) => {
  localStorage.setItem(prop, JSON.stringify(value))

  return getItem(prop)
}

export const removeItem = (prop: string) => {
  localStorage.removeItem(prop)
}
