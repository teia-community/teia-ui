import { MIMETYPE, IPFS_DEFAULT_THUMBNAIL_URI } from '@constants'

import mime from 'mime-types'
const { Buffer } = require('buffer')
const axios = require('axios')

/**
 * @typedef { {path: string?, blob: Blob} } FileHolder
 */

// const readJsonLines = require('read-json-lines-sync').default
// const { getCoverImagePathFromBuffer } = require('../utils/html')

/**
 * Upload a single file through the IPFS proxy.
 * @param {FileHolder} file
 * @returns {Promise<string>}
 */
export async function uploadFileToIPFSProxy(file) {
  const form = new FormData()

  const file_type = mime.lookup(file.path)
  console.debug(`iploading ${file.path} as ${file_type}`)

  form.append('asset', new File([file.blob], file.path, { type: file_type }))

  const res = await axios.post(
    `${process.env.REACT_APP_IPFS_UPLOAD_PROXY}/single`,
    form,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
    }
  )
  return res.data.cid
}

/**
 * Upload multiple files through the IPFS proxy
 * @param {Array<FileHolder>} files
 * @returns {Promise<string>}
 */
export async function uploadMultipleFilesToIPFSProxy(files) {
  const form = new FormData()

  files.forEach((file) => {
    const file_type = mime.lookup(file.path)
    console.debug(`uploading ${file.path} as ${file_type}`)
    form.append(
      'assets',
      new File([file.blob], encodeURI(file.path), { type: file_type })
    )
  })

  const res = await axios.post(
    `${process.env.REACT_APP_IPFS_UPLOAD_PROXY}/multiple`,
    form,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
    }
  )

  return res.data.cid
}

export const prepareFile = async ({
  name,
  description,
  tags,
  address,
  file,
  cover,
  thumbnail,
  generateDisplayUri,
  rights,
  rightUri,
  language,
  accessibility,
  contentRating,
  formats,
}) => {
  console.debug('generateDisplayUri', generateDisplayUri)
  const cid = await uploadFileToIPFSProxy({
    blob: new Blob([file.buffer]),
    path: file.file.name,
  })
  console.debug(`Successfully uploaded file to IPFS: ${cid}`)
  const uri = `ipfs://${cid}`

  if (formats.length > 0) {
    formats[0].uri = uri
    console.debug('file format', formats[0])
  }

  // upload cover image
  let displayUri = ''
  if (generateDisplayUri) {
    const coverCid = await uploadFileToIPFSProxy({
      blob: new Blob([cover.buffer]),
      path: `cover_${cover.file ? cover.file.name : cover.format.fileName}`,
    })
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
  if (generateDisplayUri) {
    const thumbnailCid = await uploadFileToIPFSProxy({
      blob: new Blob([thumbnail.buffer]),
      path: `thumbnail_${
        thumbnail.file ? thumbnail.file.name : thumbnail.format.fileName
      }`,
    })
    thumbnailUri = `ipfs://${thumbnailCid}`
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
    path: 'metadata',
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
}) => {
  const hashes = await uploadFilesToDirectory(files)
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
      path: `cover_${cover.format.fileName}`,
    })
    console.debug(`Successfully uploaded cover to IPFS: ${displayCid}`)
    displayUri = `ipfs://${displayCid}`
    if (cover?.format) {
      const format = JSON.parse(JSON.stringify(cover.format))
      format.uri = displayUri
      format.fileName = `cover_${format.fileName}`
      formats.push(format)
      console.debug('cover format', format)
    }
  } else if (hashes.cover) {
    // TODO: Remove this once generateDisplayUri option is gone
    displayUri = `ipfs://${hashes.cover}`
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
  if (generateDisplayUri) {
    const thumbnailInfo = await uploadFileToIPFSProxy({
      blob: new Blob([thumbnail.buffer]),
      path: thumbnail.format.fileName,
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
 * @param {FileHolder} file
 * @returns {boolean}
 */
function not_directory(file) {
  return file.blob.type !== MIMETYPE.DIRECTORY
}

/**
 * Uploads multiple files through the IPFS proxy,
 * grep the `index.html` for a cover image.
 * @param {Array<FileHolder>} files
 * @returns {{directory: string} }
 */
async function uploadFilesToDirectory(files) {
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
}) {
  const metadata = {
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
