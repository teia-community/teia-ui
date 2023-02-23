import { MIMETYPE, IPFS_DEFAULT_THUMBNAIL_URI } from '@constants'

import mime from 'mime-types'
import axios from 'axios'
import { Buffer } from 'buffer'
import { fetchGraphQL } from './api'
import { useUserStore } from '@context/userStore'
import { useModalStore } from '@context/modalStore'
import { FileForm, FileMint, MintFormat } from '@types'
import { gql } from 'graphql-request'

/**
 * @typedef { {path: string?, blob: Blob} } FileHolder
 */

/**
 * Upload a single file through the IPFS proxy.
 */
export async function uploadFileToIPFSProxy(
  file: FileMint,
  title = 'Preparing OBJKT'
): Promise<string | undefined> {
  const step = useModalStore.getState().step
  const show = useModalStore.getState().show

  const form = new FormData()

  const file_type = mime.lookup(file.path)
  if (!file_type) {
    show(
      'Filetype Error',
      `Could not determine the type from file ${file.path}`
    )
    return
  }
  const total_size = file.size ? ` (${(file.size / 1e6).toFixed(1)}mb)` : ''
  step(title, `uploading ${file.path}${total_size} as ${file_type}`)

  console.debug(`uploading ${file.path} as ${file_type}`)

  form.append('asset', new File([file.blob], file.path, { type: file_type }))

  const res = await axios.post(
    `${import.meta.env.VITE_IPFS_UPLOAD_PROXY}/single`,
    form,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (pe) => {
        const progress = Number((pe.loaded / pe.total) * 100).toFixed(1)
        step(
          title,
          `uploading ${file.path}${total_size} as ${file_type}
## ${progress}%`
        )
      },
    }
  )
  return res.data.cid
}

/**
 * Upload multiple files through the IPFS proxy
 */
export async function uploadMultipleFilesToIPFSProxy(files: FileMint[]) {
  const form = new FormData()
  const step = useModalStore.getState().step

  step('Preparing OBJKT', `uploading multiple files`)

  files.forEach((file) => {
    const file_type = mime.lookup(file.path)
    console.debug(`uploading ${file.path} as ${file_type}`)
    form.append(
      'assets',
      new File([file.blob], encodeURI(file.path), { type: file_type || '' })
    )
  })

  const res = await axios.post(
    `${import.meta.env.VITE_IPFS_UPLOAD_PROXY}/multiple`,
    form,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (pe: ProgressEvent) => {
        const progress = Number((pe.loaded / pe.total) * 100).toFixed(1)
        step(
          'Preparing OBJKT',
          `uploading multiple files
## ${progress}%`
        )
      },
    }
  )

  return res.data.cid
}

const isDoubleMint = async (uri: string) => {
  const uriQuery = gql`
    query uriQuery($address: String!, $ids: [String!] = "") {
      tokens(
        order_by: { minted_at: desc }
        where: {
          editions: { _gt: "0" }
          metadata_status: { _eq: "processed" }
          artifact_uri: { _in: $ids }
          artist_address: { _eq: $address }
        }
      ) {
        token_id
      }
    }
  `
  const { proxyAddress, address } = useUserStore.getState()
  const { show } = useModalStore.getState()
  const { errors, data } = await fetchGraphQL(uriQuery, 'uriQuery', {
    address: proxyAddress || address,
    ids: [uri],
  })

  console.debug(data)

  if (errors) {
    show(`GraphQL Error: ${JSON.stringify(errors)}`)
    return true
  } else if (data) {
    if (!data.tokens) return false
    const areAllTokensBurned = data.tokens.every(
      ({ editions }: { editions: number }) => editions === 0
    )

    if (areAllTokensBurned) {
      return false
    }

    show(
      `Duplicate mint detected: [#${data.tokens[0].token_id}](/objkt/${data.tokens[0].token_id}) is already minted`
    )

    return true
  }
  return false
}

interface PrepareProps {
  name: string
  description: string
  tags: string
  address: string
  file: FileForm
  cover: FileForm
  thumbnail: FileForm
  rights: string
  rightUri?: string
  language?: string
  accessibility: string
  contentRating: string
  formats: any
}
export const prepareFile = async ({
  name,
  description,
  tags,
  address,
  file,
  cover,
  thumbnail,
  rights,
  rightUri,
  language,
  accessibility,
  contentRating,
  formats,
}: PrepareProps) => {
  //TODO: clean
  const step = useModalStore.getState().step
  const show = useModalStore.getState().show

  const generateDisplayUri = !file.mimeType.startsWith('image')
  // const cid = await uploadFileToIPFSProxy(file)
  if (!file.file?.name) {
    console.error('Incomplete item received', file)
    show('No name for file', '')
    return
  }
  const cid = await uploadFileToIPFSProxy({
    blob: new Blob([file.buffer]),
    path: file.file.name,
    size: file.file?.size,
  })

  step('Preparing OBJKT', `Successfully uploaded file to IPFS: ${cid}`)
  const uri = `ipfs://${cid}`

  /** We cannot pre-compute the hash with nft.storage, but at least they seem to match when reuploading them*/
  if (await isDoubleMint(uri)) {
    throw Error('Double Mint', { cause: 'You already minted the same token.' })
  }

  if (formats.length > 0) {
    formats[0].uri = uri
    console.debug('file format', formats[0])
  }

  // upload cover image
  let displayUri = uri
  if (generateDisplayUri && cover) {
    const coverCid = await uploadFileToIPFSProxy({
      blob: new Blob([cover.buffer]),
      path: `cover_${cover.file ? cover.file.name : cover.format?.fileName}`,
      size: cover.file?.size,
    })
    step('Preparing OBJKT', `Successfully uploaded cover to IPFS: ${coverCid}`)
    console.debug(`Successfully uploaded cover to IPFS: ${coverCid}`)
    displayUri = `ipfs://${coverCid}`
    if (cover?.format) {
      const format = JSON.parse(JSON.stringify(cover.format))
      format.uri = displayUri
      format.fileName = `cover_${format.fileName}`
      formats.push(format)
      console.debug('cover format', format)
    }
  }

  // upload thumbnail image
  let thumbnailUri = IPFS_DEFAULT_THUMBNAIL_URI
  if (thumbnail) {
    const thumbnailCid = await uploadFileToIPFSProxy({
      blob: new Blob([thumbnail.buffer]),
      path: `thumbnail_${
        thumbnail.file ? thumbnail.file.name : thumbnail.format?.fileName
      }`,
      size: thumbnail.file?.size,
    })
    thumbnailUri = `ipfs://${thumbnailCid}`
    if (thumbnail?.format) {
      const format = JSON.parse(JSON.stringify(thumbnail.format))
      format.uri = thumbnailUri
      format.fileName = `thumbnail_${format.fileName}`
      formats.push(format)
      console.debug('thumbnail format', format)
    }
  } else {
    console.debug('Using default thumbnail CID')
  }

  const metadata = await buildMetadataFile({
    name,
    description,
    tags,
    uri,
    address,
    displayUri,
    thumbnailUri,
    rights,
    rightUri,
    language,
    accessibility,
    contentRating,
    formats,
  })
  step('Preparing OBJKT', 'Uploading metadata file')
  console.debug('Uploading metadata file:', JSON.parse(metadata))

  return await uploadFileToIPFSProxy({
    blob: new Blob([Buffer.from(metadata)]),
    path: 'metadata.json',
  })
}

export const prepareDirectory = async ({
  name,
  description,
  tags,
  address,
  files,
  cover,
  thumbnail,
  generateDisplayUri,
  rights,
  rightUri,
  language,
  accessibility,
  contentRating,
  formats,
}: {
  name?: string
  description?: string
  tags?: string
  address: string
  files: FileForm[]
  cover: FileForm
  thumbnail: FileForm
  generateDisplayUri: string
  rights: string
  rightUri: string
  language: string
  accessibility: string
  contentRating: string
  formats: MintFormat[]
}) => {
  const step = useModalStore.getState().step

  const hashes = await uploadFilesToDirectory(files)

  step(
    'Preparing OBJKT',
    `Successfully uploaded directory to IPFS: ${hashes.directory}`
  )
  console.debug(`Successfully uploaded directory to IPFS:`, hashes.directory)
  const uri = `ipfs://${hashes.directory}`

  if (formats.length > 0) {
    formats[0].uri = uri
    console.debug('file format', formats[0])
  }
  // upload cover image
  let displayUri = ''
  if (generateDisplayUri) {
    const displayCid = await uploadFileToIPFSProxy({
      blob: new Blob([cover.buffer]),
      path: `cover_${cover.format?.fileName || 'format'}`,
    })
    step('Preparing OBJKT', `Successfully uploaded cover to IPFS`)

    console.debug(`Successfully uploaded cover to IPFS: ${displayCid}`)
    displayUri = `ipfs://${displayCid}`
    if (cover?.format) {
      const format = JSON.parse(JSON.stringify(cover.format))
      format.uri = displayUri
      format.fileName = `cover_${format.fileName}`
      formats.push(format)
      console.debug('cover format', format)
    }
  }
  // else if (hashes.cover) {
  //   // TODO: Remove this once generateDisplayUri option is gone
  //   displayUri = `ipfs://${hashes.cover}`
  //   if (cover?.format) {
  //     const format = JSON.parse(JSON.stringify(cover.format))
  //     format.uri = displayUri
  //     format.fileName = `cover_${format.fileName}`
  //     formats.push(format)
  //     console.debug('cover format', format)
  //   }
  // }

  // upload thumbnail image
  let thumbnailUri = IPFS_DEFAULT_THUMBNAIL_URI
  if (generateDisplayUri && thumbnail) {
    const thumbnailInfo = await uploadFileToIPFSProxy({
      blob: new Blob([thumbnail.buffer]),
      path:
        thumbnail.format?.fileName ||
        thumbnail.title ||
        thumbnail.file?.name ||
        '',
    })
    thumbnailUri = `ipfs://${thumbnailInfo}`
    if (thumbnail?.format) {
      const format = JSON.parse(JSON.stringify(thumbnail.format))
      format.uri = thumbnailUri
      format.fileName = `thumbnail_${format.fileName}`
      formats.push(format)
      console.debug('thumbnail format', format)
    }
  }

  const metadata = await buildMetadataFile({
    name,
    description,
    tags,
    uri,
    address,
    displayUri,
    thumbnailUri,
    rights,
    rightUri,
    language,
    accessibility,
    contentRating,
    formats,
  })

  console.debug('Uploading metadata file:', JSON.parse(metadata))

  return await uploadFileToIPFSProxy({
    blob: new Blob([Buffer.from(metadata)]),
    path: 'metadata.json',
  })
}

/**
 * Check if the given FileHolder is a directory.
 */
function not_directory(file: FileMint) {
  return file.blob.type !== MIMETYPE.DIRECTORY
}

/**
 * Uploads multiple files through the IPFS proxy,
 * grep the `index.html` for a cover image.
 * @param {Array<FileHolder>} files
 */
async function uploadFilesToDirectory(files: FileMint[]) {
  console.debug('uploadFilesToDirectory', files)
  files = files.filter(not_directory)

  const directory = await uploadMultipleFilesToIPFSProxy(files)

  // TODO: Parse index.html to find the cover
  // TODO: Remove this once generateDisplayUri option is gone
  /*
  const data = readJsonLines(res.data)QmcjamRcHkdcADx6pYjBb5g4znZZtgenmQJyj3cwVZCzYv
  //get cover hash

  let cover = null
  const indexFile = files.find((f) => f.path === 'index.html')
  if (indexFile) {
    const indexBuffer = await indexFile.blob.arrayBuffer()
    const coverImagePath = getCoverImagePathFromBuffer(indexBuffer)
    if (coverImagePath) {
      const coverEntry = data.find((f) => f.Name === coverImagePath)
      if (coverEntry) {
        cover = coverEntry.Hash
      }
    }
  }
  const rootDir = data.find((e) => e.Name === '')

  const directory = rootDir.Hash
  */

  return { directory }
}

async function buildMetadataFile({
  name,
  description,
  tags,
  uri,
  address,
  displayUri = '',
  thumbnailUri = IPFS_DEFAULT_THUMBNAIL_URI,
  rights,
  rightUri,
  language,
  accessibility,
  contentRating,
  formats,
}: {
  name: string
  description: string
  tags: string
  uri: string
  address: string
  displayUri: string
  thumbnailUri: string
  rights: string
  rightUri?: string
  language: string
  accessibility: string
  contentRating: string
  formats: MintFormat[]
}) {
  const metadata: TeiaMetadata = {
    name,
    description,
    tags: tags ? tags.replace(/\s/g, '').split(',') : [],
    symbol: 'OBJKT',
    artifactUri: uri,
    displayUri,
    thumbnailUri,
    creators: [address],
    formats,
    decimals: 0,
    isBooleanAmount: false,
    shouldPreferSymbol: false,
    rights,
    date: new Date().toISOString(),
    mintingTool: 'https://teia.art/mint',
  }
  if (accessibility) metadata.accessibility = accessibility
  if (contentRating) metadata.contentRating = contentRating
  if (rights === 'custom') metadata.rightUri = rightUri
  if (language != null) metadata.language = language

  return JSON.stringify(metadata)
}

interface TeiaMetadata {
  name: string
  description: string
  tags: string[]
  symbol: string
  artifactUri: string
  displayUri: string
  thumbnailUri: string
  creators: string[]
  formats: MintFormat[]
  decimals: number
  isBooleanAmount: boolean
  shouldPreferSymbol: boolean
  rights: string
  date: string
  mintingTool: string
  //optional
  accessibility?: string
  contentRating?: string
  rightUri?: string
  language?: string
}
