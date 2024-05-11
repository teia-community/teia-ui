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

/**
 * Generates a cover image from the provided text.
 * @param {string} text - The text content to be rendered on the cover image.
 * @param {boolean} monospace - Indicates whether to use a monospace font.
 * @returns {Promise<File>} A Promise resolving to the generated cover image file.
 * @throws {Error} If the input text is empty.
 */
export const generateTypedArtCoverImage = async (
  text: string,
  monospace: boolean
): Promise<File> => {
  if (!text || text.length === 0) {
    throw new Error('Input text must not be empty')
  }

  const font = monospace ? 'Iosevka' : 'Source Sans Pro'
  const font_size = 16
  const cv_font = `${font_size}px ${font}`

  const createCanvasContext = (
    width: number,
    height: number
  ): CanvasRenderingContext2D => {
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Could not create canvas context')
    return ctx
  }

  const size = 1024
  const textCtx = createCanvasContext(size, size)

  textCtx.font = cv_font
  textCtx.filter = 'grayscale(100%)'

  const lines = text.split('\n')
  const longestLine = lines.reduce(
    (longest, line) =>
      textCtx.measureText(line).width > textCtx.measureText(longest).width
        ? line
        : longest,
    ''
  )

  textCtx.canvas.width = Math.min(textCtx.measureText(longestLine).width, size)
  textCtx.canvas.height = Math.min(font_size * lines.length + font_size, size)

  textCtx.fillStyle = 'transparent'
  // textCtx.fillStyle = 'black'// for debugging
  textCtx.fillRect(0, 0, textCtx.canvas.width, textCtx.canvas.height)
  textCtx.filter = 'grayscale(100%)'
  textCtx.fillStyle = 'white'

  //NOTE: yes this is required twice... not sure why
  textCtx.font = cv_font

  if (textCtx.canvas.width === size) {
    const truncatedFirstLine = lines[0].substring(0, 20)
    textCtx.fillText(truncatedFirstLine + '...', 0, font_size)
  } else {
    const x = 0
    const y = font_size
    const lineHeight = font_size

    lines.forEach((line, index) =>
      textCtx.fillText(line, x, y + index * lineHeight)
    )
  }

  const scaledCtx = createCanvasContext(size, size)
  scaledCtx.fillStyle = 'transparent'
  scaledCtx.fillRect(0, 0, size, size)

  const finalCtx = createCanvasContext(size, size)
  const coverImage = new Image()
  const textImage = new Image()

  return new Promise((resolve, reject) => {
    textImage.src = textCtx.canvas.toDataURL('svg')
    textImage.onload = () => {
      scaledCtx.imageSmoothingEnabled = true
      scaledCtx.canvas.width = size
      scaledCtx.canvas.height = size
      const hRatio = scaledCtx.canvas.width / textImage.width
      const vRatio = scaledCtx.canvas.height / textImage.height
      const ratio = Math.min(hRatio, vRatio)
      const centerShift_x =
        (scaledCtx.canvas.width - textImage.width * ratio) / 2
      const centerShift_y =
        (scaledCtx.canvas.height - textImage.height * ratio) / 2
      scaledCtx.drawImage(
        textImage,
        0,
        0,
        textImage.width,
        textImage.height,
        centerShift_x,
        centerShift_y,
        textImage.width * ratio,
        textImage.height * ratio
      )
      const scaledImage = scaledCtx.canvas.toDataURL('svg')
      coverImage.src = scaledImage
      coverImage.onload = async () => {
        finalCtx.fillStyle = 'transparent'
        finalCtx.fillRect(0, 0, size, size)
        finalCtx.drawImage(
          coverImage,
          0,
          0,
          size,
          size,
          font_size,
          font_size,
          size - font_size,
          size - font_size
        )
        finalCtx.canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('Failed to generate image'))
            return
          }
          const file = new File([blob], 'Generated Cover.png', {
            type: 'image/png',
          })
          resolve(file)
        }, 'image/png')
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
