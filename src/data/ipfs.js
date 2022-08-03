import {
  IPFS_DIRECTORY_MIMETYPE,
  IPFS_DEFAULT_THUMBNAIL_URI,
} from '../constants'
//import { NFTStorage, File } from 'nft.storage'

// const { create } = require('ipfs-http-client')
const { Buffer } = require('buffer')
const axios = require('axios')
// const readJsonLines = require('read-json-lines-sync').default
// const { getCoverImagePathFromBuffer } = require('../utils/html')

// const infuraUrl = 'https://ipfs.infura.io:5001'
//const apiKey = process.env.REACT_APP_IPFS_KEY
//const storage = new NFTStorage({ token: apiKey })

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
    form.append('assets', file)
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
  // const ipfs = create(infuraUrl)

  // const buffer = file.buffer
  // const hash = await ipfs.add(new Blob([buffer]))

  const _cid = await uploadFileToIPFSProxy(new Blob([file.buffer]))
  console.debug(`Successfully uploaded file to IPFS: ${_cid}`)
  const cid = `ipfs://${_cid}`

  if (formats.length > 0) {
    formats[0].uri = cid
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
  console.debug(`Successfully uploaded directory to IPFS: ${hashes}`)
  const cid = `ipfs://${hashes}`

  if (formats.length > 0) {
    formats[0].uri = cid
    console.debug('file format', formats[0])
  }

  // upload cover image
  // const ipfs = create(infuraUrl)

  let displayUri = ''
  if (generateDisplayUri) {
    const coverCid = await uploadFileToIPFSProxy(cover.buffer)
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
    const thumbnailInfo = await uploadFileToIPFSProxy(thumbnail.buffer)
    thumbnailUri = `ipfs://${thumbnailInfo.path}`
    if (thumbnail && thumbnail.format) {
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
  files = files.filter(not_directory)

  // const form = new FormData()

  // files.forEach((file) => {
  //   form.append('file', file.blob, encodeURIComponent(file.path))
  // })

  const directory = await uploadFilesToDirectory(files)

  // const endpoint = `${infuraUrl}/api/v0/add?pin=true&recursive=true&wrap-with-directory=true`
  // const res = await axios.post(endpoint, form, {
  // headers: { 'Content-Type': 'multipart/form-data' },
  // })

  // const data = readJsonLines(res.data)

  // TODO: Remove this once generateDisplayUri option is gone
  // get cover hash

  // let cover = null
  // const indexFile = files.find((f) => f.path === 'index.html')
  // if (indexFile) {
  //   const indexBuffer = await indexFile.blob.arrayBuffer()
  //   const coverImagePath = getCoverImagePathFromBuffer(indexBuffer)

  //   if (coverImagePath) {
  //     const coverEntry = data.find((f) => f.Name === coverImagePath)
  //     if (coverEntry) {
  //       cover = coverEntry.Hash
  //     }
  //   }
  // }

  // const rootDir = data.find((e) => e.Name === '')

  // const directory = rootDir.Hash

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
    rightUri,
    language,
    date: new Date().toISOString(),
  }
  if (accessibility) {
    metadata.accessibility = accessibility
  }
  if (contentRating) {
    metadata.contentRating = contentRating
  }

  return await uploadMetadataToIPFSProxy(Buffer.from(JSON.stringify(metadata)))
}
