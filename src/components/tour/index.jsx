import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CloseIcon } from '@icons'
import styles from './index.module.scss'

const PAD = 4 // spotlight outline sits this far outside the target

/**
 * Walkthrough rendered over the page while the URL has `?tour=<name>`. Each
 * step highlights the element marked `data-tour="<target>"`. A step with
 * `next: false` waits for the user to act (e.g. click a link that keeps
 * `?tour=<name>`). `align: 'right'` lines the popover's right edge up with
 * the target's; `above: true` places it above the target instead of below.
 */
export default function Tour({ name, steps }) {
  const [params, setParams] = useSearchParams()
  const [i, setI] = useState(0)
  // +1 after Next, -1 after Back: which way to skip a missing target.
  const [dir, setDir] = useState(1)
  const [rect, setRect] = useState(null)
  const active = params.get('tour') === name
  const step = steps[i]

  const end = () => {
    params.delete('tour')
    setParams(params)
    setI(0)
    setDir(1)
  }

  const go = (d) => {
    setDir(d)
    setI(i + d)
  }

  useEffect(() => {
    if (!active) return setI(0)
    let el = document.querySelector(`[data-tour="${step.target}"]`)
    // `display: contents` (e.g. a `fit` Button) has no box of its own:
    // measure what it shows instead.
    if (el && getComputedStyle(el).display === 'contents')
      el = el.firstElementChild
    // Target not on the page (e.g. no previewable items): skip the step in
    // the direction we were going, or finish if it was the last one.
    if (!el) {
      setRect(null)
      const n = i + dir
      if (n >= steps.length) end()
      // Nothing to go back to: head forward again.
      else if (n < 0) go(1)
      else setI(n)
      return
    }
    const measure = () => setRect(el.getBoundingClientRect())
    // Wait a frame: a parent may still be about to show the target (e.g. a
    // dialog calling showModal() in its own effect, which runs after ours).
    const frame = requestAnimationFrame(() => {
      // Taller than the screen: show its top rather than its middle.
      el.scrollIntoView({
        block: el.offsetHeight > window.innerHeight ? 'start' : 'center',
      })
      measure()
    })
    window.addEventListener('resize', measure)
    window.addEventListener('scroll', measure, true)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', measure)
      window.removeEventListener('scroll', measure, true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, step])

  const last = i === steps.length - 1 && step.next !== false

  // ← / → step like Back / Next (Done on the last step), except while typing.
  useEffect(() => {
    if (!active || !rect) return
    const onKey = (e) => {
      if (e.target.closest?.('input, textarea, select, [contenteditable]'))
        return
      if (e.key === 'ArrowLeft' && i > 0) go(-1)
      else if (e.key === 'ArrowRight' && step.next !== false)
        last ? end() : go(1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  if (!active || !rect) return null

  const viewport = document.documentElement.clientHeight
  // Kept on screen, so it may sit left of the target: shift the arrow to
  // still point at it (12px is its resting offset, see .pop::before).
  const left = Math.max(16, Math.min(rect.left - PAD, window.innerWidth - 296))
  const arrow = Math.min(rect.left - PAD - left + 12, 256)

  return (
    <>
      <div
        className={styles.spot}
        style={{
          top: rect.top - PAD,
          left: rect.left - PAD,
          width: rect.width + PAD * 2,
          height: rect.height + PAD * 2,
        }}
      />
      <div
        className={`${styles.pop} ${
          step.align === 'right' ? styles.pop_right : ''
        } ${step.above ? styles.pop_above : ''}`}
        style={{
          ...(step.above
            ? {
                bottom: viewport - rect.top + 12,
              }
            : // No room below a tall target: pin to the bottom of the screen.
            viewport - rect.bottom < 180
            ? { bottom: 16 }
            : { top: rect.bottom + 12 }),
          ...(step.align === 'right'
            ? {
                right: Math.max(
                  16,
                  document.documentElement.clientWidth - rect.right - PAD
                ),
              }
            : { left, '--arrow-left': `${arrow}px` }),
        }}
      >
        <button
          type="button"
          className={styles.close}
          onClick={end}
          aria-label="Close tour"
        >
          <CloseIcon fill="var(--text-color)" width="10" />
        </button>
        <p>{step.text}</p>
        <div className={styles.actions}>
          {i > 0 && (
            <button type="button" onClick={() => go(-1)}>
              Back
            </button>
          )}
          {step.next !== false && !last && (
            <button type="button" onClick={() => go(1)}>
              Next
            </button>
          )}
          {last && (
            <button type="button" onClick={end}>
              Done
            </button>
          )}
        </div>
      </div>
    </>
  )
}

/**
 * Standalone callout under the element marked `data-tour="<target>"`, its
 * arrow pointing up at it (right-aligned). No spotlight, no steps.
 * `children` (e.g. buttons) go in an actions row under the title.
 */
export function Hint({ target, title, onClose, children }) {
  const [rect, setRect] = useState(null)

  useEffect(() => {
    const el = document.querySelector(`[data-tour="${target}"]`)
    if (!el) return
    const measure = () => setRect(el.getBoundingClientRect())
    measure()
    // Banners above the header can shift it after mount.
    const observer = new ResizeObserver(measure)
    observer.observe(document.body)
    window.addEventListener('scroll', measure, true)
    return () => {
      observer.disconnect()
      window.removeEventListener('scroll', measure, true)
    }
  }, [target])

  if (!rect) return null

  return (
    <div
      role="note"
      className={`${styles.pop} ${styles.pop_right} ${styles.hint}`}
      style={{
        top: rect.bottom + 12,
        right: Math.max(
          16,
          document.documentElement.clientWidth - rect.right - PAD
        ),
      }}
    >
      <button
        type="button"
        className={styles.close}
        onClick={onClose}
        aria-label="Close"
      >
        <CloseIcon fill="var(--text-color)" width="10" />
      </button>
      <p>{title}</p>
      {children && <div className={styles.actions}>{children}</div>}
    </div>
  )
}

/**
 * Circled "?" that starts the tour called `name`. Blinks until clicked;
 * resets whenever the page mounts it again. Keeps the current query params
 * (e.g. a search term) alongside `tour`. `path` opens another page first.
 */
/** The same blinking "?" as TourLink, pointing at an external page. */
export function HelpLink({ href, title = 'How it works' }) {
  const [seen, setSeen] = useState(false)

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`${styles.help} ${seen ? '' : styles.blink}`}
      title={title}
      aria-label={title}
      onClick={() => setSeen(true)}
    >
      ?
    </a>
  )
}

export function TourLink({ name, title = 'How it works', path = '' }) {
  const [seen, setSeen] = useState(false)
  const [params] = useSearchParams()
  const search = new URLSearchParams(params)
  search.set('tour', name)

  return (
    <Link
      to={`${path}?${search}`}
      className={`${styles.help} ${seen ? '' : styles.blink}`}
      title={title}
      aria-label={title}
      onClick={() => setSeen(true)}
    >
      ?
    </Link>
  )
}
