export function toHHMMSS(sec) {
  var hours = Math.floor(sec / 3600)
  var minutes = Math.floor((sec - hours * 3600) / 60)
  var seconds = sec - hours * 3600 - minutes * 60

  if (hours < 10) {
    hours = '0' + hours
  }
  if (minutes < 10) {
    minutes = '0' + minutes
  }
  if (seconds < 10) {
    seconds = '0' + seconds
  }
  return hours + ':' + minutes + ':' + seconds
}

export const getTimeAgo = (props) => {
  let stamp = Math.round(new Date(props).getTime() / 1000)
  let now = Math.round(new Date().getTime() / 1000)

  let difference = now - stamp
  let unit, value

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

  // console.log(unit, value)
  return `${value} ${unit} ago`
}
