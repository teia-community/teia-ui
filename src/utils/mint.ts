import {
  COVER_COMPRESSOR_OPTIONS,
  MIMETYPE,
  THUMBNAIL_COMPRESSOR_OPTIONS,
} from '@constants'
import type { FileForm } from '@types'
import Compressor from 'compressorjs'
import { getMimeType } from './sanitise'
import { truncate } from 'lodash'
import { MidiJSON, TrackJSON } from '@tonejs/midi'
import { NoteJSON } from '@tonejs/midi/dist/Note'

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
  monospace: boolean,
  size: number,
  horizontalAlign: boolean
): Promise<File> => {
  if (!text || text.trim().length === 0) {
    throw new Error('Input text must not be empty')
  }
  size = size || 1024
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

  const font = monospace ? 'Iosevka' : 'Source Sans Pro'
  const fontRatio = 0.75
  const minFontSize = 16
  let fontSize = Math.max(minFontSize, size * fontRatio)

  const cv_font = `${fontSize}px ${font}`

  const finalCtx = createCanvasContext(size, size)
  finalCtx.font = cv_font
  finalCtx.filter = 'grayscale(100%)'
  finalCtx.fillStyle = 'transparent'
  finalCtx.fillRect(0, 0, size, size)
  finalCtx.fillStyle = 'white'

  let lines = text.split('\n').filter((line, index, array) => {
    return (
      line.trim() !== '' ||
      index === array.length - 1 ||
      array[index + 1].trim() !== ''
    )
  })

  const margin = 50
  const maxWidth = size - margin * 2
  const maxHeight = size - margin * 2

  const longestLine = lines.reduce(
    (longest, line) =>
      finalCtx.measureText(line).width > finalCtx.measureText(longest).width
        ? line
        : longest,
    ''
  )

  let lineHeight =
    finalCtx.measureText(')').actualBoundingBoxAscent +
    finalCtx.measureText(')').actualBoundingBoxDescent +
    5
  let lineWidth = finalCtx.measureText(longestLine).width

  while (lines.length * lineHeight > maxHeight || lineWidth > maxWidth) {
    fontSize -= 1
    finalCtx.font = `${fontSize}px ${font}`

    if (fontSize <= minFontSize) {
      break
    }

    lineWidth = finalCtx.measureText(longestLine).width
    lineHeight =
      finalCtx.measureText(')').actualBoundingBoxAscent +
      finalCtx.measureText(')').actualBoundingBoxDescent +
      5
  }

  if (lineWidth > maxWidth) {
    lines = [
      text.split('\n')[0].substring(0, Math.floor(maxWidth / fontSize) - 3) +
      '...',
    ]
  }
  lineHeight =
    finalCtx.measureText(')').actualBoundingBoxAscent +
    finalCtx.measureText(')').actualBoundingBoxDescent +
    5

  const totalTextHeight = lines.length * lineHeight
  const baselineOffset = (size - totalTextHeight) / 2

  finalCtx.imageSmoothingEnabled = true
  finalCtx.imageSmoothingQuality = 'high'

  lines.forEach((line, index) => {
    let xPosition = margin
    if (horizontalAlign) {
      const textWidth = finalCtx.measureText(line).width
      xPosition = (size - textWidth) / 2
    }
    finalCtx.fillText(
      line,
      xPosition,
      baselineOffset + (index + 1) * lineHeight
    )
  })

  return new Promise((resolve, reject) => {
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
  })
}

/**
 * Generates a cover image from the provided Midi JSON object.
 * @param {string} trackTitle - The title of the track to be populated in the cover file. If not provided, default to first track title.
 * @param {MIDIJson} midi - The midi JSON file, parsed in using new Midi(arrayBuffer)
 * @returns {Promise<File>} A Promise resolving to the generated cover image file.
 * @throws {Error} If the input text is empty.
*/
export const generateMidiCover = async (
  trackTitle: string,
  midi: MidiJSON
): Promise<File> => {
  return new Promise((resolve, reject) => {

    const size = 1024;
    const padding = 30;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      reject(new Error('Could not create canvas context'));
      return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // retrieve tracks and track name to create midi image
    const tracks = midi.tracks;
    const trackName = truncate((trackTitle || midi?.tracks?.[0].name || 'Midi Track'), { length: 50 })

    // Add white border
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 5;
    ctx.strokeRect(0, 0, canvas.width, canvas.height);

    // Adjust the drawing area for notes to be inside the padding
    const drawingWidth = canvas.width - 2 * padding;
    const drawingHeight = canvas.height - 2 * padding;
    const noteYScale = drawingHeight / 128; // assuming MIDI notes range from 0 to 127

    // Add track name at the top, centered
    ctx.font = '40px Arial';
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.fillText(trackName, canvas.width / 2, padding + 40);
    ctx.fillText("(MIDI)", canvas.width / 2, padding + 90);

    tracks.forEach((track: TrackJSON, index: number) => {
      const notes = track.notes;
      const totalDuration = notes.reduce((acc: number, note: NoteJSON) => Math.max(acc, note.time + note.duration), 0);


      // get different opacity of white based on track
      const alpha = 0.5 + ((index / tracks.length) * 0.5);
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;

      notes.forEach((note: NoteJSON) => {
        const x = padding + (note.time * drawingWidth / totalDuration);
        const y = canvas.height - padding - (note.midi * noteYScale); // Scale MIDI note for better visibility
        const width = (note.duration * drawingWidth / totalDuration);
        const height = 5;

        ctx.fillRect(x, y, width, height);
      });
    })

    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Failed to generate image'));
        return;
      }

      const file = new File([blob], 'Generated_MIDI_Cover.png', {
        type: 'image/png',
      });
      resolve(file);
    }, 'image/png');
  });
}

export const convertFileToFileForm = async (
  fileToConvert: File
): Promise<FileForm> => {
  const mimeType: string =
    fileToConvert.type === ''
      ? await getMimeType(fileToConvert) as string
      : fileToConvert.type
  const buffer = await fileToConvert.arrayBuffer()
  const title = fileToConvert.name + '.' + mimeType.split('/')[1]

  // set reader for preview
  let reader: any = new FileReader()
  const blob = new Blob([buffer as any], { type: mimeType as string })
  reader = await blobToDataURL(blob)

  const format = {
    mimeType: mimeType,
    fileName: title,
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

/**
 * Processes an audio data URI into a blob for AudioVisualizer
 * @param {string} reader - The data URI from the artifact reader
 * @returns {Blob} The processed audio blob
 */

export const processAudioForVisualizer = (reader: string) => {
  const rawBase64 = reader.split(',')[1] || reader;
  const byteString = atob(rawBase64);
  const arrayBuffer = new ArrayBuffer(byteString.length);
  const uint8Array = new Uint8Array(arrayBuffer);

  for (let i = 0; i < byteString.length; i++) {
    uint8Array[i] = byteString.charCodeAt(i);
  }

  return new Blob([arrayBuffer], { type: 'audio/mpeg' });
};