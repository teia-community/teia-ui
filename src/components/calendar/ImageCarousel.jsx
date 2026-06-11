import { useState } from 'react'
import styles from '@style'

/**
 * Minimal, dependency-free image carousel. Renders `images` (an array of URLs)
 * one at a time with prev/next controls. The browser loads the `<img>` src —
 * there are no fetches in this component.
 *
 * @param {{ images?: string[] }} props
 */
export default function ImageCarousel({ images = [] }) {
  const [index, setIndex] = useState(0)

  if (!images.length) return null

  const count = images.length
  const safeIndex = Math.min(index, count - 1)
  const prev = () => setIndex((i) => (i - 1 + count) % count)
  const next = () => setIndex((i) => (i + 1) % count)

  return (
    <div
      className={styles.carousel}
      role="group"
      aria-roledescription="carousel"
      aria-label={`Event images, ${count} total`}
    >
      <img
        className={styles.carousel_img}
        src={images[safeIndex]}
        alt={`Slide ${safeIndex + 1} of ${count}`}
        loading="lazy"
      />

      {count > 1 && (
        <div className={styles.carousel_controls}>
          <button type="button" onClick={prev} aria-label="Previous image">
            ‹
          </button>
          <span className={styles.carousel_count} aria-live="polite">
            {safeIndex + 1} / {count}
          </span>
          <button type="button" onClick={next} aria-label="Next image">
            ›
          </button>
        </div>
      )}
    </div>
  )
}
