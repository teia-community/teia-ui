import { MintState } from '@context/mintStore'
import { convertFileToFileForm, generateTypedArtCoverImage } from './mint'

export const processTypedInput = async (
  data: MintState
): Promise<MintState> => {
  if (!data.typedinput) {
    throw Error('No typedinput')
  }

  const blob = new Blob([data.typedinput], {
    type: 'text/plain;charset=utf-8',
  })
  const file = new File([blob], 'typed.txt', {
    type: 'text/plain',
    lastModified: Date.now(),
  })

  // add to artifact object so it is consistent with all other types
  data.artifact = await convertFileToFileForm(file)
  data.artifact.reader = URL.createObjectURL(blob)

  // generate cover automatically
  const coverFile = await generateTypedArtCoverImage(
    data.typedinput,
    data.isMonoType === true
  )
  data.cover = await convertFileToFileForm(coverFile)

  let tags: string[] = []
  let lower_tags: string[] = []

  if (data.tags) {
    tags = data.tags.split(',')
    lower_tags = tags.map((t) => t.toLowerCase())
  }
  // add monospace to tags if not already available so that it can be rendered
  // with the right classes in OBJKT and on teia
  if (data.isMonoType && !lower_tags.includes('monospace')) {
    tags = [...tags, 'monospace']
    data.tags = tags.join(',')
  }
  // ensure if it's not monospace type, remove any occurrences of `monospace` in tags
  // otherwise it will not render correctly on objkt.
  else if (!data.isMonoType && lower_tags.includes('monospace')) {
    const newTags = tags
      .filter((tag) => tag.toLowerCase() !== 'monospace')
      .join(',')
    data.tags = newTags
  }

  // override description to the typedinput
  data.description = data.typedinput

  return data
}
