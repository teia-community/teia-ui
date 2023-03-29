import { useEffect } from 'react'

function increasingInterval(callback, interval, increaseAmount, maxInterval) {
  let iterations = 0

  function run() {
    iterations++
    callback(iterations)
    interval += increaseAmount

    if (interval >= maxInterval) {
      return
    }

    setTimeout(run, interval)
  }

  setTimeout(run, interval)
}
/**
 * Hook for april's fool day, it randomly rotates the style of all elements
 *
 */
export default function useFool() {
  useEffect(() => {
    const rotate = () => {
      const elements = document.querySelectorAll('*')
      elements.forEach((element) => {
        if (
          element.tagName === 'BODY' ||
          element.tagName === 'HTML' ||
          element.tagName === 'MAIN' ||
          element.tagName === 'HEAD' ||
          element.id === 'root' ||
          element.classList.contains('no-fool')
        )
          return

        let random = Math.random() * 3
        element.style.transition = 'transform 500ms'
        element.style.transform = `rotate(${random}deg)`
      })
    }
    increasingInterval(rotate, 1000, 100, 5000)
    rotate()
    // Clean up
    // return () => {
    //   console.log('No more fooling around!')
    //   clearInterval(interval)
    // }
  }, [])
}
