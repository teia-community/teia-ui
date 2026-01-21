import { useRef, useEffect, useState } from 'react'

export const Visualiser = ({ src }: { src: string }) => {
  const ref = useRef<HTMLCanvasElement>(null)
  const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null)
  const [ratio, setRatio] = useState(1)
  const [audio, setAudio] = useState<HTMLAudioElement>()
  const [raf, setRaf] = useState<number>()
  const [data, setData] = useState<Float32Array>()
  const [analyser, setAnalyser] = useState<AnalyserNode>()

  useEffect(() => {
    if (ref.current) {
      setCtx(ref.current.getContext('2d'))
    }
    setRatio(Math.max(1, Math.min(window.devicePixelRatio, 2)))

    return () => {
      if (raf) cancelAnimationFrame(raf)
    }
  }, [ref, raf])

  useEffect(() => {
    resize()
  })

  useEffect(() => {
    let _audio = new Audio()
    _audio.src = src
    _audio.controls = false
    _audio.loop = true
    _audio.autoplay = false
    _audio.crossOrigin = 'anonymous'

    setAudio(_audio)

    let audioCtx = new AudioContext()
    const _analyser = audioCtx.createAnalyser()
    setAnalyser(_analyser)

    let source = audioCtx.createMediaElementSource(_audio)
    source.connect(_analyser)
    source.connect(audioCtx.destination)

    const _data = new Float32Array(_analyser.frequencyBinCount)
    setData(_data)
    _analyser.getFloatTimeDomainData(_data)
  }, [src])

  const play = () => {
    if (audio) {
      audio.play()
      setRaf(requestAnimationFrame(update))
    }
  }

  const pause = (reset?: boolean) => {
    if (audio) {
      audio.pause()

      if (raf) cancelAnimationFrame(raf)

      if (reset) {
        audio.currentTime = 0
      }
    }
  }

  const resize = () => {
    if (!ctx) return
    const width = 320
    const height = 320
    ctx.canvas.width = width * ratio
    ctx.canvas.height = height * ratio
    ctx.canvas.style.width = `${width}px`
    ctx.canvas.style.height = `${height}px`
  }

  const update = () => {
    if (!ctx || !analyser || !data) return

    analyser.getFloatTimeDomainData(data)

    resize()

    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)

    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
    ctx.beginPath()

    for (let i = 0; i < data.length; i++) {
      const x = i
      const y = (0.5 + data[i] / 2) * ctx.canvas.height

      if (i === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    }

    ctx.strokeStyle = 'var(--text-color)'
    ctx.lineWidth = 2 * window.devicePixelRatio
    ctx.stroke()
    setRaf(requestAnimationFrame(update))
  }

  return (
    <canvas
      onClick={() => {
        if (audio?.paused) {
          play()
        } else {
          pause()
        }
      }}
      ref={ref}
    ></canvas>
  )
}
