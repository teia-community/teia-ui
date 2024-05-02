import {
  COVER_COMPRESSOR_OPTIONS,
  MIMETYPE,
  THUMBNAIL_COMPRESSOR_OPTIONS,
} from '@constants'
import type { FileForm } from '@types'
import Compressor from 'compressorjs'
import { getMimeType } from './sanitise'

/**
 * Return the expected extension (as string without dot) from a given mimtetype
 */
export const extensionFromMimetype = (mime: string) => {
  switch (mime) {
    case MIMETYPE.JPEG:
      return 'jpg'
    case MIMETYPE.PNG:
      return 'png'
    case MIMETYPE.GIF:
      return 'gif'
    default:
      return 'jpg'
  }
}

/** Remove the extension from the string, i.e the last dot (.) part */
export const removeExtension = (name: string) => {
  return name.split('.').slice(0, -1).join('.')
}

interface ImageDimensions {
  imageWidth: number
  imageHeight: number
}

export const getImageDimensions = async (
  file: FileForm
): Promise<ImageDimensions> => {
  return await new Promise((resolve, reject) => {
    if (file) {
      const image = new Image()
      image.src = file.reader as string
      image.onload = function () {
        resolve({ imageWidth: image.width, imageHeight: image.height })
      }
      image.onerror = (e) => {
        resolve({ imageWidth: 0, imageHeight: 0 })
      }
      return
    }
    resolve({ imageWidth: 0, imageHeight: 0 })
  })
}

export const generateCompressedImage = async (
  file: FileForm,
  options: Compressor.Options
): Promise<FileForm | undefined> => {
  if (!file.file) return undefined
  const blob = await compressImage(file.file, options)
  const mimeType = blob.type
  const buffer = await blob.arrayBuffer()
  const reader = await blobToDataURL(blob)
  return { mimeType, buffer, reader }
}

const blobToDataURL = async (
  blob: Blob
): Promise<string | ArrayBuffer | null> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = reject
    reader.onload = (e) => resolve(reader.result)
    reader.readAsDataURL(blob)
  })
}

export const compressImage = (
  file: File,
  options: Compressor.Options
): Promise<File | Blob> => {
  return new Promise((resolve, reject) => {
    new Compressor(file, {
      ...options,
      success(blob) {
        resolve(blob)
      },
      error(err) {
        reject(err)
      },
    })
  })
}

export const generateCoverAndThumbnail = async (
  file: FileForm
): Promise<{ cover?: FileForm; thumbnail?: FileForm }> => {
  // TMP: skip GIFs to avoid making static
  if (file.mimeType === MIMETYPE.GIF) {
    return {
      cover: file,
      thumbnail: file,
    }
  }
  console.debug('Generating cover')
  const cover = await generateCompressedImage(file, COVER_COMPRESSOR_OPTIONS)
  // setCover(cover)
  console.debug('Generating thumbnail')
  const thumb = await generateCompressedImage(
    file,
    THUMBNAIL_COMPRESSOR_OPTIONS
  )
  return {
    cover,
    thumbnail: thumb,
  }
}

export const generateTypedArtCoverImage = async (
  txt: string,
  monospace: boolean
) => {
  const font = monospace ? 'IBM Plex Mono' : 'Source Sans Pro'
  const cv_font = `16px ${font}`
  if (txt.length === 0) {
    return false
  }
  const createContext = function (width: number, height: number) {
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Could not create canvas context')
    return ctx
  }
  const c = createContext(512, 512)
  c.filter = 'grayscale(100%)'

  let dize = []
  const lines = txt.split('\n')
  dize = lines
  c.font = cv_font
  const x = 0
  const y = 16
  const lineheight = 16
  const result = dize.reduce(
    (r, e) => (c.measureText(r).width < c.measureText(e).width ? e : r),
    ''
  )
  if (result.length > 130) {
    c.canvas.width = 512
    c.canvas.height = 512
  } else {
    c.canvas.width = c.measureText(result).width
    c.canvas.height = lineheight * dize.length + 12
  }
  c.fillStyle = 'transparent'
  c.fillRect(0, 0, c.canvas.width, c.canvas.height)
  c.filter = 'grayscale(100%)'
  c.fillStyle = 'white'
  if (c.canvas.width === 512) {
    const s = lines[0].substring(0, 20)
    c.fillText(s + '...', 16, 256)
  } else {
    for (let i = 0; i < lines.length; i++) {
      c.fillText(lines[i], x, y + i * lineheight)
    }
  }
  const ca = createContext(512, 512)
  ca.fillStyle = 'transparent'
  ca.fillRect(0, 0, 512, 512)
  const cerceve = createContext(512, 512)
  const cImage = new Image()
  const img = new Image()
  return new Promise((resolve, reject) => {
    img.src = c.canvas.toDataURL('svg')
    img.onload = function () {
      ca.imageSmoothingEnabled = true
      ca.width = 512
      ca.height = 512
      const hRatio = ca.width / img.width
      const vRatio = ca.height / img.height
      const ratio = Math.min(hRatio, vRatio)
      const centerShift_x = (ca.width - img.width * ratio) / 2
      const centerShift_y = (ca.height - img.height * ratio) / 2
      ca.drawImage(
        img,
        0,
        0,
        img.width,
        img.height,
        centerShift_x,
        centerShift_y,
        img.width * ratio,
        img.height * ratio
      )
      const t = ca.canvas.toDataURL('svg')
      cImage.src = t
      cImage.onload = async function () {
        cerceve.fillStyle = 'transparent'
        cerceve.fillRect(0, 0, 512, 512)
        cerceve.drawImage(cImage, 0, 0, 512, 512, 16, 16, 512 - 16, 512 - 16)
        const ctx = cerceve.canvas.toDataURL('svg')
        const res = await fetch(ctx)
        const blob = await res.blob()
        const file = new File([blob], 'Generated Cover.png', {
          type: 'image/png',
        })

        resolve(file)
      }
    }
  })
}

export const convertFileToFileForm = async (
  fileToConvert: File
): Promise<FileForm> => {
  const mimeType =
    fileToConvert.type === ''
      ? await getMimeType(fileToConvert)
      : fileToConvert.type
  const buffer = Buffer.from(await fileToConvert.arrayBuffer())
  const title = fileToConvert.name + '.png'

  // set reader for preview
  let reader: any = new FileReader()
  const blob = new Blob([buffer], { type: mimeType })
  reader = await blobToDataURL(blob)

  const format = {
    mimeType: mimeType,
    fileName: title + '.png',
    fileSize: fileToConvert.size,
  }

  return {
    title,
    mimeType,
    file: fileToConvert,
    buffer,
    reader,
    format,
  }
}
