import { convertFileToFileForm, generateTypedArtCoverImage } from './mint'

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
  let coverFile = await generateTypedArtCoverImage(
    data.typedinput,
    data.isMonoType
  )
  data.cover = await convertFileToFileForm(coverFile)

  let tags = data.tags.toLowerCase().split(',')

  // add monospace to tags if not already available so that it can be rendered
  // with the right classes in OBJKT and on teia
  if (data.isMonoType && !tags.includes('monospace')) {
    tags = [...tags, 'monospace']
    data.tags = tags.join(',')
  }
  // ensure if it's not monospace type, remove any occurences of `monospace` in tags
  // otherwise it will not render correctly on objkt.
  else if (!data.isMonoType && tags.includes('monospace')) {
    let newTags = tags
      .filter((tag) => tag.toLowerCase() !== 'monospace')
      .join(',')
    data.tags = newTags
  }

  // override description to the typedinput
  data.description = data.typedinput

  return data
}
