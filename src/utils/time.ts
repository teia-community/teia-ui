export function toHHMMSS(sec: number) {
  let _hours = Math.floor(sec / 3600)
  let _minutes = Math.floor((sec - _hours * 3600) / 60)
  let _seconds = sec - _hours * 3600 - _minutes * 60
  let hours, minutes, seconds
  if (_hours < 10) {
    hours = `0${hours}`
  }
  if (_minutes < 10) {
    minutes = `0${minutes}`
  }
  if (_seconds < 10) {
    seconds = `0${seconds}`
  }
  return `${hours}:${minutes}:${seconds}`
}

export const getTimeAgo = (timestamp: number) => {
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

export const getISODate = (timestamp: number) => {
  const pad = (n: number, s = 2) => `${new Array(s).fill(0)}${n}`.slice(-s)
  const d = new Date(timestamp)
  return `${pad(d.getFullYear(), 4)}-${pad(d.getMonth() + 1)}-${pad(
    d.getDate()
  )} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

export const getWordDate = (timestamp: number) => {
  const date = new Date(timestamp)
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
  }

  //return date.toLocaleString(navigator.language, options)
  return date.toLocaleString('en-GB', options)
}
