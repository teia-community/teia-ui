import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@atoms/button'
import Identicon from '@atoms/identicons'
import { HashToURL } from '@utils'
import { ARTIST_IMAGE_MIMES } from '@data/artists'
import { useAccountRoles } from '@data/roles'
import { RoleBadgesView } from '@components/user-badges'
import { TwitterIcon } from '@icons'
import { resolveVerifiedBluesky } from '@utils/bsky'
import '@google/model-viewer'
import styles from './index.module.scss'

const SLIDE_SIZE = 3

// Resized webp via imgproxy; raw display_uri can be many MB per image.
const thumbUrl = (token) =>
  token.teia_meta?.preview_uri && import.meta.env.VITE_IMGPROXY
    ? `${import.meta.env.VITE_IMGPROXY}${token.teia_meta.preview_uri}`
    : HashToURL(token.display_uri)

// `filters`: [{ label, hide: token => bool, active }]. A token matched by an
// active filter renders as a blank tile with its own reveal button.
// First frame of a GIF without downloading the whole file. The CDN honours
// Range requests; we fetch roughly one byte per pixel (measured: 60/60 recent
// GIFs decode a complete first frame at that size), decode with the strict
// createImageBitmap so a partial frame never paints, and retry once at 4x.
const GIF_MIN_BYTES = 128 * 1024
const GIF_MAX_BYTES = 4 * 1024 * 1024
const GIF_THUMB_PX = 400 // canvas cap; native-size canvases x150 tiles blow GPU memory

// Decode a few GIFs at a time: each decoded frame is native size in memory,
// and 150 at once takes the tab down.
const GIF_CONCURRENCY = 4
let gifActive = 0
const gifQueue = []
function gifSlot() {
  return new Promise((resolve) => {
    const run = () => {
      gifActive++
      resolve(() => {
        gifActive--
        gifQueue.shift()?.()
      })
    }
    gifActive < GIF_CONCURRENCY ? run() : gifQueue.push(run)
  })
}

function gifHeadBytes(token) {
  const [w, h] = (token.formats?.[0]?.dimensions?.value || '0x0')
    .split('x')
    .map(Number)
  return Math.min(GIF_MAX_BYTES, Math.max(GIF_MIN_BYTES, w * h))
}

async function fetchGifFrame(url, bytes) {
  const res = await fetch(url, { headers: { Range: `bytes=0-${bytes - 1}` } })
  return createImageBitmap(await res.blob())
}

function GifThumb({ token, fallback }) {
  const ref = useRef(null)
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    let alive = true
    let release
    const url = HashToURL(token.display_uri)
    const head = gifHeadBytes(token)
    gifSlot()
      .then((r) => {
        release = r
        if (!alive) return null
        return fetchGifFrame(url, head).catch(() =>
          fetchGifFrame(url, Math.min(GIF_MAX_BYTES * 2, head * 4))
        )
      })
      .then((bm) => {
        if (!bm || !alive) return
        const scale = Math.min(1, GIF_THUMB_PX / Math.max(bm.width, bm.height))
        canvas.width = Math.round(bm.width * scale)
        canvas.height = Math.round(bm.height * scale)
        canvas.getContext('2d').drawImage(bm, 0, 0, canvas.width, canvas.height)
        bm.close()
      })
      .catch(() => alive && setFailed(true))
      .finally(() => release?.())
    return () => {
      alive = false
    }
    // Parent rebuilds token objects each render; key on the id so a
    // re-render never refetches the frame.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token.token_id])
  if (failed) return fallback
  return <canvas ref={ref} className={styles.thumb} title={token.name} />
}

// Still frame with a type badge; hover swaps in `live` (the animated GIF or
// muted video). `live` is only mounted while hovered, so at most one full
// animation is decoded at a time.
function HoverThumb({ label, still, live }) {
  const [hover, setHover] = useState(false)
  return (
    <div
      className={styles.hover_wrap}
      data-tour="media"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {still}
      {hover && live}
      {!hover && <span className={styles.hover_badge}>{label}</span>}
    </div>
  )
}

const VIDEO_MIMES = ['video/mp4', 'video/quicktime', 'video/webm']
const AUDIO_MIMES = ['audio/mpeg', 'audio/wav', 'audio/ogg']
const MODEL_MIMES = ['model/gltf-binary', 'model/gltf+json']

// Video/audio poster (display_uri) is often itself a GIF; those go through
// the same first-frame path as GIF tokens, the rest through imgproxy.
function PosterStill({ token, label }) {
  const posterMime = token.formats?.find(
    (f) => f.uri === token.display_uri
  )?.mime_type
  if (posterMime === 'image/gif') {
    return (
      <GifThumb
        token={token}
        fallback={<div className={styles.hidden_tile}>{label}</div>}
      />
    )
  }
  return (
    <img
      className={styles.thumb}
      src={thumbUrl(token)}
      alt={token.name}
      loading="lazy"
    />
  )
}

// One AudioContext for every tile; browsers cap how many can exist.
let audioCtx
function getAudioCtx() {
  audioCtx ??= new AudioContext()
  return audioCtx
}

// Hover preview for audio: streams the track through an analyser at zero
// gain and draws a live scope over the cover. Click the speaker to unmute.
// Browsers keep the AudioContext suspended until the page has had a click,
// so before that the hover shows the cover only; the speaker click counts.
function AudioScope({ token }) {
  const canvasRef = useRef(null)
  const gainRef = useRef(null)
  const audioRef = useRef(null)
  const [muted, setMuted] = useState(true)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = getAudioCtx()
    const audio = new Audio()
    audio.crossOrigin = 'anonymous'
    audio.loop = true
    audio.src = HashToURL(token.artifact_uri)
    audioRef.current = audio

    const source = ctx.createMediaElementSource(audio)
    const analyser = ctx.createAnalyser()
    analyser.fftSize = 512
    const gain = ctx.createGain()
    gain.gain.value = 0
    gainRef.current = gain
    source.connect(analyser)
    analyser.connect(gain)
    gain.connect(ctx.destination)

    const data = new Float32Array(analyser.fftSize)
    // Each point eases toward the live sample with a 0.25s time constant, so
    // the trace decays instead of jittering frame to frame.
    const SCOPE_DECAY_S = 0.25
    const smoothed = new Float32Array(analyser.fftSize)
    const c2d = canvas.getContext('2d')
    let raf
    let last = performance.now()
    const draw = (now) => {
      analyser.getFloatTimeDomainData(data)
      const alpha = 1 - Math.exp(-(now - last) / 1000 / SCOPE_DECAY_S)
      last = now
      const { width, height } = canvas
      c2d.clearRect(0, 0, width, height)
      c2d.beginPath()
      for (let i = 0; i < data.length; i++) {
        smoothed[i] += (data[i] - smoothed[i]) * alpha
        const x = (i / (data.length - 1)) * width
        const y = (0.5 - smoothed[i] / 2) * height
        i ? c2d.lineTo(x, y) : c2d.moveTo(x, y)
      }
      c2d.strokeStyle = '#fff'
      c2d.lineWidth = 2
      c2d.lineJoin = 'round'
      c2d.stroke()
      raf = requestAnimationFrame(draw)
    }

    ctx.resume().catch(() => {})
    audio.play().catch(() => {}) // blocked until the page has had a click
    raf = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(raf)
      audio.pause()
      audio.src = ''
      source.disconnect()
      analyser.disconnect()
      gain.disconnect()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token.token_id])

  const toggleMute = (e) => {
    e.preventDefault() // inside the tile's <Link>
    e.stopPropagation()
    getAudioCtx().resume()
    audioRef.current.play().catch(() => {}) // click is the gesture hover lacked
    gainRef.current.gain.value = muted ? 1 : 0
    setMuted(!muted)
  }

  return (
    <>
      <canvas
        ref={canvasRef}
        className={styles.scope}
        width={200}
        height={200}
      />
      <button
        type="button"
        className={styles.scope_mute}
        onClick={toggleMute}
        aria-label={muted ? 'Unmute' : 'Mute'}
      >
        {muted ? '🔇' : '🔊'}
      </button>
    </>
  )
}

const TEXT_MIMES = ['text/plain', 'text/markdown']
// Enough for a few lines; the tile clamps whatever fits anyway.
const TEXT_HEAD_BYTES = 2048

// Rough markdown → plain text for a tiny excerpt.
function stripMarkdown(md) {
  return md
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '') // images
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1') // links → text
    .replace(/<[^>]+>/g, '') // html
    .replace(/^\s{0,3}(#{1,6}|>|[-*+]|\d+\.)\s+/gm, '') // headings, quotes, lists
    .replace(/[*_~`]+/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function TextThumb({ token, fallback }) {
  const [text, setText] = useState(null)
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    let alive = true
    fetch(HashToURL(token.artifact_uri), {
      headers: { Range: `bytes=0-${TEXT_HEAD_BYTES - 1}` },
    })
      .then((r) => r.text())
      .then((t) => {
        if (!alive) return
        const plain = stripMarkdown(t)
        // Posts usually open with the title as an H1; the tile shows it once.
        setText(
          plain.startsWith(token.name)
            ? plain.slice(token.name.length).trim()
            : plain
        )
      })
      .catch(() => alive && setFailed(true))
    return () => {
      alive = false
    }
  }, [token])
  if (failed) return fallback
  return (
    <div className={styles.text_tile} title={token.name}>
      <strong>{token.name}</strong>
      <p>{text}</p>
    </div>
  )
}

export const FILETYPES = [
  { label: 'Image', mimes: ARTIST_IMAGE_MIMES },
  { label: 'GIF', mimes: ['image/gif'] },
  { label: 'Video', mimes: ['video/mp4', 'video/quicktime', 'video/webm'] },
  { label: 'Audio', mimes: ['audio/mpeg', 'audio/wav', 'audio/ogg'] },
  { label: 'SVG', mimes: ['image/svg+xml'] },
  { label: 'Interactive', mimes: ['application/x-directory'] },
  { label: '3D', mimes: MODEL_MIMES },
  { label: 'PDF', mimes: ['application/pdf'] },
  { label: 'Text', mimes: ['text/plain', 'text/markdown'] },
]

function Carousel({ tokens, filters }) {
  const [slide, setSlide] = useState(0)
  // token_ids revealed on this card, one image at a time.
  const [revealed, setRevealed] = useState(() => new Set())

  const hiddenLabels = (token) =>
    revealed.has(token.token_id)
      ? []
      : filters.filter((f) => f.active && f.hide(token)).map((f) => f.label)

  if (!tokens.length) {
    // Same footprint as a slide, so the card stays full height.
    return (
      <div className={styles.placeholder}>
        <div className={styles.placeholder_strip}>
          <div className={styles.slide}>
            <div className={styles.blank} />
            <div className={styles.blank} />
            <div className={styles.blank} />
          </div>
          <div className={styles.placeholder_label}>no creations</div>
        </div>
        <div className={styles.controls}>&nbsp;</div>
      </div>
    )
  }

  const slides = Math.ceil(tokens.length / SLIDE_SIZE)
  const safeSlide = Math.min(slide, slides - 1)
  const visible = tokens.slice(
    safeSlide * SLIDE_SIZE,
    safeSlide * SLIDE_SIZE + SLIDE_SIZE
  )

  return (
    <div className={styles.carousel}>
      <div className={styles.slide}>
        {visible.map((token) => {
          const labels = hiddenLabels(token)
          return labels.length ? (
            <div key={token.token_id} className={styles.hidden_tile}>
              <Button
                shadow_box
                onClick={() =>
                  setRevealed((r) => new Set(r).add(token.token_id))
                }
              >
                Show {labels.join(' / ')}
              </Button>
            </div>
          ) : ARTIST_IMAGE_MIMES.includes(token.mime_type) ? (
            <Link key={token.token_id} to={`/objkt/${token.token_id}`}>
              <img
                className={styles.thumb}
                src={thumbUrl(token)}
                alt={token.name}
                loading="lazy"
              />
            </Link>
          ) : token.mime_type === 'image/gif' ? (
            <Link key={token.token_id} to={`/objkt/${token.token_id}`}>
              <HoverThumb
                label="GIF"
                still={
                  <GifThumb
                    token={token}
                    fallback={<div className={styles.hidden_tile}>GIF</div>}
                  />
                }
                live={
                  <img
                    className={styles.hover_live}
                    src={HashToURL(token.display_uri)}
                    alt={token.name}
                  />
                }
              />
            </Link>
          ) : VIDEO_MIMES.includes(token.mime_type) && token.display_uri ? (
            <Link key={token.token_id} to={`/objkt/${token.token_id}`}>
              <HoverThumb
                label="VIDEO"
                still={<PosterStill token={token} label="Video" />}
                live={
                  <video
                    className={styles.hover_live}
                    src={HashToURL(token.artifact_uri)}
                    muted
                    autoPlay
                    loop
                    playsInline
                  />
                }
              />
            </Link>
          ) : AUDIO_MIMES.includes(token.mime_type) && token.display_uri ? (
            <Link key={token.token_id} to={`/objkt/${token.token_id}`}>
              <HoverThumb
                label="AUDIO"
                still={<PosterStill token={token} label="Audio" />}
                live={<AudioScope token={token} />}
              />
            </Link>
          ) : MODEL_MIMES.includes(token.mime_type) && token.display_uri ? (
            <Link key={token.token_id} to={`/objkt/${token.token_id}`}>
              <HoverThumb
                label="3D"
                still={<PosterStill token={token} label="3D" />}
                live={
                  // React 18 can't set `class` on custom elements; style the wrapper.
                  <div className={`${styles.hover_live} ${styles.model_live}`}>
                    <model-viewer
                      src={HashToURL(token.artifact_uri)}
                      auto-rotate=""
                      auto-rotate-delay="0"
                      rotation-per-second="60deg"
                      interaction-prompt="none"
                      disable-zoom=""
                    />
                  </div>
                }
              />
            </Link>
          ) : TEXT_MIMES.includes(token.mime_type) && token.artifact_uri ? (
            <Link key={token.token_id} to={`/objkt/${token.token_id}`}>
              <TextThumb
                token={token}
                fallback={<div className={styles.hidden_tile}>Text</div>}
              />
            </Link>
          ) : (
            <Link
              key={token.token_id}
              to={`/objkt/${token.token_id}`}
              className={styles.hidden_tile}
            >
              {FILETYPES.find((t) => t.mimes.includes(token.mime_type))
                ?.label ?? token.mime_type}
            </Link>
          )
        })}
      </div>
      {/* Always rendered so every card is the same height. */}
      <div className={styles.controls}>
        {slides > 1 ? (
          <>
            <button
              type="button"
              onClick={() => setSlide((i) => (i - 1 + slides) % slides)}
              aria-label="Previous creations"
            >
              ‹
            </button>
            <span>
              {safeSlide + 1} / {slides}
            </span>
            <button
              type="button"
              onClick={() => setSlide((i) => (i + 1) % slides)}
              aria-label="Next creations"
            >
              ›
            </button>
          </>
        ) : (
          <span>&nbsp;</span>
        )}
      </div>
    </div>
  )
}

// Everything an artist can choose to show on their card, in display order.
// Stored on-chain as subjkt metadata `card.show`; see configure.jsx.
export const CARD_FIELDS = [
  { key: 'bio', label: 'Bio' },
  { key: 'roles', label: 'Role badges' },
  { key: 'domain', label: 'Tezos domain' },
  { key: 'website', label: 'Website' },
  { key: 'twitter', label: 'Twitter' },
  { key: 'bluesky', label: 'Bluesky' },
  { key: 'discord', label: 'Discord' },
  { key: 'github', label: 'GitHub' },
  { key: 'baker', label: 'Baker' },
  { key: 'teia', label: 'TEIA balance' },
  { key: 'since', label: 'Member since' },
]
export const DEFAULT_SHOW = ['bio']

// Free-text tags an artist adds to their own card (`card.tags`). Kept small
// so they read as chips, not a bio.
export const MAX_TAGS = 6
export const MAX_TAG_LENGTH = 20
export function parseTags(input) {
  return [
    ...new Set(
      input
        .split(',')
        .map((t) => t.trim().replace(/^#/, '').toLowerCase())
        .filter(Boolean)
        .map((t) => t.slice(0, MAX_TAG_LENGTH))
    ),
  ].slice(0, MAX_TAGS)
}

// Local draft of an artist's card config until the on-chain write lands.
export const draftKey = (address) => `artist-card:${address}`
export function readDraft(address) {
  try {
    const raw = localStorage.getItem(draftKey(address))
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function useBluesky(address, enabled) {
  const [bsky, setBsky] = useState(null)
  useEffect(() => {
    if (!enabled) return
    let alive = true
    resolveVerifiedBluesky(address).then((r) => alive && setBsky(r))
    return () => {
      alive = false
    }
  }, [address, enabled])
  return bsky
}

/**
 * One artist card. `extras` is the batched TzKT / Tezos Domains / DAO data
 * for this address (see useArtistExtras); `show` lists CARD_FIELDS keys;
 * `tags` are the artist's own free-text chips.
 */
export default function ArtistCard({
  artist,
  extras = {},
  show = DEFAULT_SHOW,
  tags = [],
  hazardFilters = [],
  marketFilter = () => true,
}) {
  const roles = useAccountRoles(show.includes('roles') ? artist.address : null)
  const bsky = useBluesky(artist.address, show.includes('bluesky'))
  const on = (k) => show.includes(k)

  const links = [
    on('domain') &&
      extras.domain && {
        label: extras.domain,
        href: `https://tzkt.io/${artist.address}`,
      },
    on('website') &&
      extras.website && {
        label: extras.website.replace(/^https?:\/\//i, '').replace(/\/$/, ''),
        href: extras.website,
      },
    on('twitter') &&
      extras.twitter && {
        label: `@${extras.twitter}`,
        icon: <TwitterIcon className={styles.link_icon} />,
        href: `https://twitter.com/${extras.twitter}`,
      },
    on('bluesky') &&
      bsky?.handle && {
        label: `@${bsky.handle}`,
        href: `https://bsky.app/profile/${bsky.did}`,
      },
    on('discord') &&
      extras.discord && { label: extras.discord, title: 'Discord' },
    on('github') &&
      extras.github && {
        label: extras.github,
        href: `https://github.com/${extras.github}`,
      },
  ].filter(Boolean)

  const facts = [
    on('baker') && { label: 'Baker', value: extras.baker || 'Not delegated' },
    on('teia') &&
      extras.teia != null && {
        label: 'TEIA',
        value: Math.round(extras.teia * 10) / 10,
      },
    on('since') &&
      extras.since && {
        label: 'Since',
        value: new Date(extras.since).getFullYear(),
      },
  ].filter(Boolean)

  return (
    <div className={styles.card} data-tour="card">
      <div className={styles.header}>
        <Identicon
          className={styles.identicon}
          address={artist.address}
          logo={artist.identicon}
        />
        <div className={styles.info}>
          <Link
            className={styles.name}
            to={artist.href ?? `/${encodeURIComponent(artist.name)}`}
          >
            {artist.name}
          </Link>
          {on('roles') && (
            <RoleBadgesView roles={roles} className={styles.badges} />
          )}
          <p className={styles.description}>
            {on('bio') ? artist.description : ''}
          </p>
          {tags.length > 0 && (
            <div className={styles.tags}>
              {tags.map((t) => (
                <span key={t} className={styles.chip}>
                  {t}
                </span>
              ))}
            </div>
          )}
          {(links.length > 0 || facts.length > 0) && (
            <div className={styles.meta}>
              {links.map((l) =>
                l.href ? (
                  <a
                    key={l.label}
                    href={l.href}
                    target="_blank"
                    rel="noreferrer"
                    title={l.label}
                  >
                    {l.icon ?? l.label}
                  </a>
                ) : (
                  <span key={l.label} title={l.title}>
                    {l.label}
                  </span>
                )
              )}
              {facts.map((f) => (
                <span key={f.label}>
                  {f.label}: {f.value}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
      <Carousel
        tokens={artist.tokens
          .map((t) => ({ ...t, artist: artist.address }))
          .filter(marketFilter)}
        filters={hazardFilters}
      />
    </div>
  )
}
