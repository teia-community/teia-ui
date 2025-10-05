import { Buffer } from 'buffer'
import Process from 'process'
globalThis.Buffer = Buffer
globalThis.process = Process

// Polyfills for midi player
// Check if the global process variable exists; if not, create it.
if (typeof process === 'undefined') {
  globalThis.process = {}
}

// Check if hrtime is already defined; if not, define it.
if (!process.hrtime) {
  process.hrtime = function (start) {
    // performance.now() gives us time in milliseconds as a float
    var now = performance.now() * 1e-3 // Convert ms to seconds
    var sec = Math.floor(now) // Get the whole second part
    var nano = Math.floor((now % 1) * 1e9) // Convert fractional seconds to nanoseconds

    if (start) {
      // If a previous timestamp is provided, calculate the difference
      sec = sec - start[0]
      nano = nano - start[1]
      if (nano < 0) {
        sec--
        nano += 1e9
      }
    }

    return [sec, nano]
  }
}
