// Polyfills for midi player (Specifically @magenta/music)
// Check if hrtime is already defined; if not, define it using performance.now()
if (typeof process !== 'undefined' && !process.hrtime) {
  process.hrtime = function (start) {
    const now = performance.now() // returns milliseconds as a float
    let seconds = Math.floor(now / 1000)
    let nanoseconds = Math.floor((now % 1000) * 1000000)

    if (start) {
      seconds -= start[0]
      nanoseconds -= start[1]
      if (nanoseconds < 0) {
        seconds -= 1
        nanoseconds += 1000000000
      }
    }
    return [seconds, nanoseconds]
  }
}
