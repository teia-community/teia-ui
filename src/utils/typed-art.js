import { convertFileToFileForm, generateTypedArtImage } from './mint'

export const processTypedInput = async (data) => {
  let blob = new Blob([data.typedinput], { type: 'text/plain;charset=utf-8' })
  let file = new File([blob], 'typed.txt', {
    type: 'text/plain',
    lastModified: Date.now(),
  })

  // add to artifact object so it is consistent with all other types
  data.artifact = await convertFileToFileForm(file)
  data.artifact.reader = URL.createObjectURL(blob)

  // generate cover automatically
  let coverFile = await generateTypedArtImage(data.typedinput, data.isMonoType)
  data.cover = await convertFileToFileForm(coverFile)

  // add monospace to tags if not already available so that it can be rendered
  // with the right fonts on OBJKT and on teia
  if (data.isMonoType && !data.tags.toLowerCase().includes('monospace')) {
    data.tags = data.tags?.length > 0 ? data.tags + ',monospace' : 'monospace'
  }

  return data
}
