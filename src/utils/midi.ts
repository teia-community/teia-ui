import { Midi } from '@tonejs/midi'
import { convertFileToFileForm, generateMidiCover } from './mint'

async function processMidiData(sourceUrl: string, volume: string | number) {
  try {
    const midi: any = await new (Midi as any).fromUrl(sourceUrl)

    const scaleFactor = parseInt(String(volume)) / 100

    // Modify MIDI data
    midi.tracks.forEach((track: any) => {
      track.notes.forEach((note: any) => {
        note.velocity *= scaleFactor // Apply scale factor to velocity
      })
    })

    // Serialize the MIDI data back to binary and create a Blob
    const modifiedMidiArrayBuffer = midi.toArray()
    const modifiedMidiBlob = new Blob([modifiedMidiArrayBuffer], {
      type: 'audio/midi',
    })

    // Create and return the Blob URL
    return URL.createObjectURL(modifiedMidiBlob)
  } catch (error) {
    console.error('Failed to modify MIDI data:', error)
    throw error // Rethrow to allow caller to handle it
  }
}

export const processMidiCover = async (data: any) => {
  const midiDataFile = new Midi(data.artifact.buffer)
  const cover = await generateMidiCover(data.title, midiDataFile)
  data.cover = await convertFileToFileForm(cover)

  return data
}

export default processMidiData
