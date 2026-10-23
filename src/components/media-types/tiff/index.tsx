import { useEffect, useRef, useState } from 'react'
import styles from '@style'
import { MediaTypeProps } from '@types'

/**
 * TIFF, drawn by hand.
 *
 * No browser decodes TIFF, so these tokens used to render as a broken image
 * icon with nothing to explain it. The decoder is pulled in only when such a
 * token is actually on screen, which keeps it off every other page.
 */
export const TiffComponent = ({
  artifactUri,
  displayUri,
  previewUri,
  displayView,
  nft,
}: MediaTypeProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const holderRef = useRef<HTMLDivElement>(null)
  const [state, setState] = useState<'loading' | 'ready' | 'failed'>('loading')
  const [inView, setInView] = useState(false)

  const src = previewUri || (displayView ? artifactUri : displayUri)

  // A grid of these would otherwise download and decode every TIFF at once:
  // twenty-five cards measured 146MB of canvas and twenty-five full-size
  // downloads, for thumbnails. Nothing is fetched until it is nearly on
  // screen.
  useEffect(() => {
    const holder = holderRef.current
    if (!holder) return
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true)
      return
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setInView(true)
          observer.disconnect()
        }
      },
      { rootMargin: '300px' }
    )
    observer.observe(holder)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!src || !inView) return
    let cancelled = false

    async function draw() {
      try {
        const [{ default: UTIF }, response] = await Promise.all([
          import('utif'),
          fetch(src as string),
        ])
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        const buffer = await response.arrayBuffer()
        if (cancelled) return

        const pages = UTIF.decode(buffer)
        if (!pages.length) throw new Error('no images in file')
        // Multi-page TIFFs are rare here and only the first page is the work.
        const page = pages[0]
        UTIF.decodeImage(buffer, page)
        const rgba = UTIF.toRGBA8(page)
        if (cancelled) return

        const canvas = canvasRef.current
        if (!canvas) return
        canvas.width = page.width
        canvas.height = page.height
        const context = canvas.getContext('2d')
        if (!context) throw new Error('no 2d context')
        context.putImageData(
          new ImageData(new Uint8ClampedArray(rgba), page.width, page.height),
          0,
          0
        )
        setState('ready')
      } catch (error) {
        if (!cancelled) {
          console.error(`Could not decode TIFF for OBJKT #${nft?.token_id}`, error)
          setState('failed')
        }
      }
    }

    draw()
    return () => {
      cancelled = true
    }
  }, [src, inView, nft?.token_id])

  if (state === 'failed') {
    return (
      <div className={styles.container} ref={holderRef}>
        <p className={styles.notice}>
          This TIFF could not be decoded. Download the file to view it.
        </p>
      </div>
    )
  }

  return (
    <div className={styles.container} ref={holderRef}>
      <canvas
        ref={canvasRef}
        className={styles.canvas}
        aria-label={nft?.name || `OBJKT ${nft?.token_id}`}
        style={{ visibility: state === 'ready' ? 'visible' : 'hidden' }}
      />
      {state === 'loading' && <p className={styles.notice}>Decoding TIFF…</p>}
    </div>
  )
}

export default TiffComponent
