import { Midi } from '@tonejs/midi'

async function processMidiData(sourceUrl, volume) {
  let response
  let arrayBuffer

  try {
    // check if we are reading on the feed / preview component
    if (!sourceUrl.includes('blob:')) {
      // Fetch and parse the MIDI file
      response = await fetch(sourceUrl)
      arrayBuffer = await response.arrayBuffer()
    } else {
      // blob, user is on preview component ready to mint
      arrayBuffer = await new Response(sourceUrl).arrayBuffer()
    }

    const midi = await new Midi.fromUrl(sourceUrl)

    const scaleFactor = parseInt(volume) / 100

    // Modify MIDI data
    midi.tracks.forEach((track) => {
      track.notes.forEach((note) => {
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

export default processMidiData
