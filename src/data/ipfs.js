import {
  IPFS_DIRECTORY_MIMETYPE,
  IPFS_DEFAULT_THUMBNAIL_URI,
} from '../constants'

const { Buffer } = require('buffer')
const axios = require('axios')
// const readJsonLines = require('read-json-lines-sync').default
// const { getCoverImagePathFromBuffer } = require('../utils/html')

export async function uploadFileToIPFSProxy(file) {
  const form = new FormData()

  form.append('asset', file)
  const res = await axios.post(
    `${process.env.REACT_APP_IPFS_UPLOAD_PROXY}/single`,
    form,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
    }
  )
  return res.data.cid
}

export async function uploadMultipleFilesToIPFSProxy(files) {
  const form = new FormData()

  files.forEach((file) => {
    form.append('assets', file.blob, encodeURIComponent(file.path))
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

export async function uploadMetadataToIPFSProxy(metadata) {
  return await uploadFileToIPFSProxy(
    new File([metadata], 'metadata', {
      type: 'application/json',
    })
  )
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

  const cid = await uploadFileToIPFSProxy(new Blob([file.buffer]))
  console.debug(`Successfully uploaded file to IPFS: ${cid}`)
  const uri = `ipfs://${cid}`

  if (formats.length > 0) {
    formats[0].uri = uri
    console.debug('file format', formats[0])
  }

  // upload cover image
  let displayUri = ''
  if (generateDisplayUri) {
    // const coverHash = await uploadFileToIPFSProxy(new Blob([cover.buffer]))
    const coverCid = await uploadFileToIPFSProxy(new Blob([cover.buffer]))
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
    const thumbnailCid = await uploadFileToIPFSProxy(
      new Blob([thumbnail.buffer])
    )
    thumbnailUri = `ipfs://${thumbnailCid}`
    if (thumbnail?.format) {
      const format = JSON.parse(JSON.stringify(thumbnail.format))
      format.uri = thumbnailUri
      format.fileName = `thumbnail_${format.fileName}`
      formats.push(format)
      console.debug('thumbnail format', format)
    }
  }

  return await uploadMetadataFile({
    name,
    description,
    tags,
    cid,
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
  // upload directory of files
  const hashes = await uploadFilesToDirectory(files)
  console.debug(`Successfully uploaded directory to IPFS:`, hashes.directory)
  const cid = `ipfs://${hashes.directory}`

  if (formats.length > 0) {
    formats[0].uri = cid
    console.debug('file format', formats[0])
  }

  // upload cover image
  let displayUri = ''
  if (generateDisplayUri) {
    const coverCid = await uploadFileToIPFSProxy(new Blob([cover.buffer]))
    console.debug(`Successfully uploaded cover to IPFS: ${coverCid}`)
    displayUri = `ipfs://${coverCid}`
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
    const thumbnailInfo = await uploadFileToIPFSProxy(
      new Blob([thumbnail.buffer])
    )
    thumbnailUri = `ipfs://${thumbnailInfo}`
    if (thumbnail?.format) {
      const format = JSON.parse(JSON.stringify(thumbnail.format))
      format.uri = thumbnailUri
      format.fileName = `thumbnail_${format.fileName}`
      formats.push(format)
      console.debug('thumbnail format', format)
    }
  }

  return await uploadMetadataFile({
    name,
    description,
    tags,
    cid,
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
}

function not_directory(file) {
  return file.blob.type !== IPFS_DIRECTORY_MIMETYPE
}

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

async function uploadMetadataFile({
  name,
  description,
  tags,
  cid,
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
  // const ipfs = create(infuraUrl)

  const metadata = {
    name,
    description,
    tags: tags.replace(/\s/g, '').split(','),
    symbol: 'OBJKT',
    artifactUri: cid,
    displayUri,
    thumbnailUri,
    creators: [address],
    formats,
    decimals: 0,
    isBooleanAmount: false,
    shouldPreferSymbol: false,
    rights,
    date: new Date().toISOString(),
  }
  if (accessibility) metadata.accessibility = accessibility

  if (contentRating) metadata.contentRating = contentRating

  if (rights === 'custom') metadata.rightUri = rightUri

  if (language != null) metadata.language = language

  console.debug('Uploading metadata file:', metadata)
  return await uploadMetadataToIPFSProxy(Buffer.from(JSON.stringify(metadata)))
}
