import { MIMETYPE } from '@constants'
import Compressor from 'compressorjs'

/**
 * Return the expected extension (as string without dot) from a given mimtetype
 * @param {string} mime
 * @returns
 */
export const extensionFromMimetype = (mime) => {
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

/**
 * Remove the extension from the string, i.e the last dot (.) part
 * @param {string} name
 * @returns {string}
 */
export const removeExtension = (name) => {
  return name.split('.').slice(0, -1).join('.')
}

// Image compression
/**
 * @typedef ImageDimensions
 * @property {number} imageWidth The width of the image.
 * @property {number} imageHeight The height of the image.
 */

/**
 * Return the dimensions of the given file image.
 * @param {import('@types').FileMint} file
 * @returns {Promise<ImageDimensions>} dimensions
 */
export const getImageDimensions = async (file) => {
  return await new Promise((resolve, reject) => {
    if (file) {
      const image = new Image()
      image.src = file.reader
      image.onload = function () {
        resolve({ imageWidth: this.width, imageHeight: this.height })
      }
      image.onerror = (e) => {
        resolve({ imageWidth: 0, imageHeight: 0 })
      }
      return
    }
    resolve({ imageWidth: 0, imageHeight: 0 })
  })
}
/**
 *
 * @param {import('@types').FileMint} file
 * @param {Compressor.Options} options
 * @returns {{mimeType:string, buffer:Buffer, reader:ArrayBuffer}}
 */
export const generateCompressedImage = async (file, options) => {
  const blob = await compressImage(file.file, options)
  const mimeType = blob.type
  const buffer = await blob.arrayBuffer()
  const reader = await blobToDataURL(blob)
  return { mimeType, buffer, reader }
}

/**
 *
 * @param {*} blob
 * @returns {Promise<ArrayBuffer>}
 */
const blobToDataURL = async (blob) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = reject
    reader.onload = (e) => resolve(reader.result)
    reader.readAsDataURL(blob)
  })
}

/**
 *
 * @param {File} file
 * @param {Compressor.Options} options
 * @returns {Promise<File|Blob>}
 */
export const compressImage = (file, options) => {
  return new Promise(async (resolve, reject) => {
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
