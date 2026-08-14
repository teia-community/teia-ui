import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import classnames from 'classnames'
import { Loading } from '@atoms/loading'
import { IconToggle } from '@atoms/toggles'
import { PlayIcon, PauseIcon, SingleViewIcon, MasonryIcon } from '@icons'
import { MIMETYPE } from '@constants'
import {
  useCuration,
  useCurationContent,
  useCurationTokens,
} from '@data/curations'
import { useLocalSettings } from '@context/localSettingsStore'
import { useTitle } from '@hooks/use-title'
import { walletPreview } from '@utils/string'
import { HashToURL } from '@utils'
import styles from '@style'

// HTMLAudioElement cannot decode midi...
const UNPLAYABLE = [MIMETYPE.MIDI, MIMETYPE.MID]

/**
 * Tokens the browser can play as audio.
 * MP3s
 * MP4s
 */
export const isPlayableAudio = (token) =>
  (token.mime_type?.startsWith('audio') || token.mime_type === MIMETYPE.MP4) &&
  !UNPLAYABLE.includes(token.mime_type)

const artistName = (token) =>
  token.artist_profile?.name || walletPreview(token.artist_address)

const coverURL = (token, size) =>
  token.display_uri || token.thumbnail_uri
    ? HashToURL(token.display_uri || token.thumbnail_uri, 'CDN', { size })
    : ''

const formatTime = (seconds) => {
  if (!Number.isFinite(seconds)) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${String(secs).padStart(2, '0')}`
}

/**
 * Keeps `timeupdate` (~4x/sec) out of the player so the track list doesn't
 * re-render. Remounted per track by the parent's `key`.
 */
function SeekBar({ audioRef }) {
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const onTime = () => setProgress(audio.currentTime)
    const onMeta = () => setDuration(audio.duration)
    audio.addEventListener('timeupdate', onTime)
    audio.addEventListener('loadedmetadata', onMeta)
    // The track may already be loaded
    onTime()
    onMeta()
    return () => {
      audio.removeEventListener('timeupdate', onTime)
      audio.removeEventListener('loadedmetadata', onMeta)
    }
  }, [audioRef])

  const seek = (event) => {
    const time = Number(event.target.value)
    audioRef.current.currentTime = time
    setProgress(time)
  }

  return (
    <div className={styles.player_seek}>
      <input
        type="range"
        aria-label="Seek"
        min={0}
        max={Number.isFinite(duration) ? duration : 0}
        step={0.1}
        value={progress}
        onChange={seek}
      />
      <div className={styles.player_times}>
        <span>{formatTime(progress)}</span>
        <span>{formatTime(duration)}</span>
      </div>
    </div>
  )
}

const TrackList = memo(function TrackList({ tracks, currentIndex, onSelect }) {
  return (
    <ul className={styles.player_list}>
      {tracks.map((track, index) => (
        <li key={track.key}>
          <button
            type="button"
            className={classnames(styles.player_track, {
              [styles.player_track_active]: index === currentIndex,
            })}
            onClick={() => onSelect(index)}
          >
            <img src={coverURL(track, 'small')} alt="" />
            <span className={styles.player_track_text}>
              <span className={styles.player_track_name}>{track.name}</span>
              <span className={styles.player_track_artist}>
                {artistName(track)}
              </span>
            </span>
          </button>
        </li>
      ))}
    </ul>
  )
})

export default function CurationPlayer() {
  const { id } = useParams()
  const curationId = Number(id)

  const { curation, isLoading } = useCuration(curationId)
  const { data: content } = useCurationContent(curation?.cid)
  const { data: tokens } = useCurationTokens(content?.tokens)

  const audioRef = useRef(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState(1)
  const [compact, setCompact] = useState(false)

  const title = content?.title || `Curation ${curationId}`
  useTitle(title)

  // The player opens in its own window, outside the app shell
  useEffect(() => {
    const { theme, applyTheme } = useLocalSettings.getState()
    applyTheme(theme)
  }, [])

  const tracks = useMemo(() => (tokens ?? []).filter(isPlayableAudio), [tokens])
  const track = tracks[currentIndex]
  const src = track ? HashToURL(track.artifact_uri, 'CDN', { size: 'raw' }) : ''

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume
  }, [volume])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !src) return
    if (!isPlaying) {
      audio.pause()
      return
    }
    // play() starts loading whatever `preload` held back and begins as soon as
    // it has data. It rejects when autoplay is blocked.
    let superseded = false
    audio.play().catch(() => {
      if (!superseded) setIsPlaying(false)
    })
    return () => {
      superseded = true
    }
  }, [isPlaying, src])

  const selectTrack = useCallback((index) => {
    setCurrentIndex(index)
    setIsPlaying(true)
  }, [])

  const onEnded = () => {
    if (currentIndex < tracks.length - 1) setCurrentIndex(currentIndex + 1)
    else setIsPlaying(false)
  }

  if (isLoading) {
    return (
      <div className={styles.player}>
        <Loading message="Loading" />
      </div>
    )
  }

  if (!curation || curation.hidden) {
    return (
      <div className={styles.player}>
        <p className={styles.empty}>
          {curation ? 'This curation has been hidden.' : 'Curation not found.'}
        </p>
      </div>
    )
  }

  if (!content || (content.tokens?.length && !tokens)) {
    return (
      <div className={styles.player}>
        <Loading message="Loading" />
      </div>
    )
  }

  if (!tracks.length) {
    return (
      <div className={styles.player}>
        <h1 className={styles.player_heading}>{title}</h1>
        <p className={styles.empty}>No music in this curation</p>
      </div>
    )
  }

  const cover = coverURL(track, 'raw')
  const isVideo = track.mime_type === MIMETYPE.MP4

  return (
    <div
      className={classnames(styles.player, {
        [styles.player_compact]: compact,
      })}
    >
      <div className={styles.player_top}>
        <h1 className={styles.player_heading}>{title}</h1>
        <div className={styles.player_view_toggle}>
          <IconToggle
            alt="large cover view"
            toggled={!compact}
            onClick={() => setCompact(false)}
            icon={<SingleViewIcon />}
          />
          <IconToggle
            alt="compact playlist view"
            toggled={compact}
            onClick={() => setCompact(true)}
            icon={<MasonryIcon />}
          />
        </div>
      </div>

      <div className={styles.player_now}>
        <video
          ref={audioRef}
          className={classnames(styles.player_cover, {
            [styles.player_media_hidden]: !isVideo,
          })}
          src={src}
          poster={cover || undefined}
          preload="metadata"
          playsInline
          onEnded={onEnded}
        />
        {!isVideo &&
          (cover ? (
            <img
              className={styles.player_cover}
              src={cover}
              alt={`cover for ${track.name}`}
            />
          ) : (
            <div className={styles.player_cover} />
          ))}
        <p className={styles.player_name}>{track.name}</p>
        <p className={styles.player_artist}>{artistName(track)}</p>
      </div>

      <SeekBar key={currentIndex} audioRef={audioRef} />

      <div className={styles.player_controls}>
        <button
          type="button"
          className={styles.player_ctrl}
          aria-label="Previous track"
          disabled={currentIndex === 0}
          onClick={() => setCurrentIndex(currentIndex - 1)}
        >
          &#9198;
        </button>
        <button
          type="button"
          className={classnames(styles.player_ctrl, styles.player_ctrl_main)}
          aria-label={isPlaying ? 'Pause' : 'Play'}
          onClick={() => setIsPlaying(!isPlaying)}
        >
          {isPlaying ? (
            <PauseIcon fill="var(--text-color)" width={28} height={28} />
          ) : (
            <PlayIcon fill="var(--text-color)" width={28} height={28} />
          )}
        </button>
        <button
          type="button"
          className={styles.player_ctrl}
          aria-label="Next track"
          disabled={currentIndex === tracks.length - 1}
          onClick={() => setCurrentIndex(currentIndex + 1)}
        >
          &#9197;
        </button>
      </div>

      <div className={styles.player_volume}>
        <span>Vol</span>
        <input
          type="range"
          aria-label="Volume"
          min={0}
          max={1}
          step={0.01}
          value={volume}
          onChange={(event) => setVolume(Number(event.target.value))}
        />
      </div>

      <TrackList
        tracks={tracks}
        currentIndex={currentIndex}
        onSelect={selectTrack}
      />
    </div>
  )
}
