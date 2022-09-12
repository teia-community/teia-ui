export function toHHMMSS(sec) {
  let hours = Math.floor(sec / 3600)
  let minutes = Math.floor((sec - hours * 3600) / 60)
  let seconds = sec - hours * 3600 - minutes * 60

  if (hours < 10) {
    hours = `0${hours}`
  }
  if (minutes < 10) {
    minutes = `0${minutes}`
  }
  if (seconds < 10) {
    seconds = `0${seconds}`
  }
  return `${hours}:${minutes}:${seconds}`
}

export const getTimeAgo = (timestamp) => {
  const stamp = Math.round(new Date(timestamp).getTime() / 1000)
  const now = Math.round(new Date().getTime() / 1000)

  const difference = now - stamp
  let unit
  let value

  if (difference / 60 < 60) {
    unit = 'minutes'
    value = Math.round(difference / 60)

    if (value <= 1) {
      unit = 'minute'
    }
  } else if (difference / (60 * 60) < 24) {
    unit = 'hours'
    value = Math.round(difference / (60 * 60))

    if (value <= 1) {
      unit = 'hour'
    }
  } else {
    unit = 'days'
    value = Math.round(difference / (60 * 60 * 24))

    if (value <= 1) {
      unit = 'day'
    }
  }

  return `${value} ${unit} ago`
}

export const getISODate = (timestamp) => {
  const pad = (n, s = 2) => `${new Array(s).fill(0)}${n}`.slice(-s)
  const d = new Date(timestamp)
  return `${pad(d.getFullYear(), 4)}-${pad(d.getMonth() + 1)}-${pad(
    d.getDate()
  )} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

export const getWordDate = (timestamp) => {
  const date = new Date(timestamp)
  const options = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
  }

  //return date.toLocaleString(navigator.language, options)
  return date.toLocaleString('en-GB', options)
}
