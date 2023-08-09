import * as fflate from 'fflate'
import mime from 'mime-types'
import { ALLOWED_COVER_MIMETYPES } from '@constants'

export async function unzipMedia(buffer: Buffer) {
  // unzip into blobs
  const unzipped = fflate.unzipSync(buffer)
  let entries = Object.entries(unzipped).map((entry) => {
    const fileName = getFileName(entry[0])
    return {
      fileName,
      buffer: entry[1],
      mimeType: undefined as string | undefined,
    }
  })

  // keep only images/videos
  entries = entries
    .map((e) => {
      e.mimeType = mime.lookup(e.fileName) || undefined
      return e
    })
    .filter((e) => {
      if (e.mimeType) {
        return ALLOWED_COVER_MIMETYPES.includes(e.mimeType)
      }
      return false
    })

  // format as: { meta, blob, reader }
  const media = []
  for (let i = 0; i < entries.length; i++) {
    const buffer = entries[i].buffer
    const type = entries[i].mimeType
    const blob = new Blob([buffer], { type })
    let meta
    if (blob.type.indexOf('video') === 0) {
      meta = await getVideoMetadata(blob)
    } else if (blob.type.indexOf('image') === 0) {
      meta = await getImageMetadata(blob)
    }
    const reader = await blobToDataURL(blob)
    media.push({ meta, buffer, reader })
  }

  return media
}

export async function getMediaMetadata(blob: Blob) {
  if (blob.type.indexOf('image') === 0) {
    return await getImageMetadata(blob)
  } else if (blob.type.indexOf('video') === 0) {
    return await getVideoMetadata(blob)
  } else {
    return { mimeType: blob.type }
  }
}

export function getImageMetadata(blob: Blob) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      resolve({
        mimeType: blob.type,
        fileSize: blob.size,
        dimensions: {
          width: img.width,
          height: img.height,
        },
      })
    }
    img.onerror = (err) => {
      reject(err)
    }
    img.src = URL.createObjectURL(blob)
  })
}

export function getVideoMetadata(blob: Blob) {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    video.addEventListener(
      'loadedmetadata',
      () => {
        resolve({
          mimeType: blob.type,
          fileSize: blob.size,
          duration: video.duration,
          dimensions: {
            width: video.videoWidth,
            height: video.videoHeight,
          },
        })
      },
      false
    )
    video.addEventListener('error', (err) => {
      reject(err)
    })

    video.src = URL.createObjectURL(blob)
  })
}

async function blobToDataURL(blob: Blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = reject
    reader.onload = (e) => resolve(reader.result)
    reader.readAsDataURL(blob)
  })
}

function getFileName(path: string) {
  const parts = path.split('/')
  return parts[parts.length - 1]
}
