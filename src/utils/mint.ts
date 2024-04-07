import {
  COVER_COMPRESSOR_OPTIONS,
  MIMETYPE,
  THUMBNAIL_COMPRESSOR_OPTIONS,
} from '@constants'
import type { FileForm } from '@types'
import Compressor from 'compressorjs'
import { UltimateTextToImage } from "ultimate-text-to-image";
import { getMimeType } from './sanitise';

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

export const generateTypedArtImage = async(
  textContent: string,
  isMono: boolean
): Promise<File | void> => {
  if (textContent) {
    const textToImage = await new UltimateTextToImage(textContent, {
    fontColor: "#FFFFFF",
    fontFamily: isMono ? 'IBM Plex Mono' : 'Source Sans Pro',
    backgroundColor: "transparent",
    margin: 20
  }).render();
  
  let dataUrl = textToImage.toDataUrl(); // image/png by default

  return await fetch(dataUrl)
    .then(res => res.blob())
    .then(blob => new File([blob], "Generated Cover.png",{ type: "image/png" })
  )
  }
}

export const convertFileToFileForm = async(
  fileToConvert: File
): Promise<FileForm> => {
  const mimeType = fileToConvert.type === '' ? await getMimeType(fileToConvert) : fileToConvert.type
  const buffer = Buffer.from(await fileToConvert.arrayBuffer())
  const title = fileToConvert.name+".png";

  // set reader for preview
  let reader: any = new FileReader()
  const blob = new Blob([buffer], { type: mimeType })
  reader = await blobToDataURL(blob)


  const format = {
    mimeType: mimeType,
    fileName: title+'.png',
    fileSize: fileToConvert.size
  }

  return {
    title,
    mimeType,
    file: fileToConvert,
    buffer,
    reader,
    format
  }
}