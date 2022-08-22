import * as fflate from 'fflate'
import mime from 'mime-types'
import { MIMETYPE } from '../constants'

export async function prepareFilesFromZIP(buffer) {
  console.debug('Preparing files from ZIP')
  // unzip files
  let files = await unzipBuffer(buffer)

  // save raw index file
  const indexBlob = files['index.html']
  files['index_raw.html'] = new Blob([indexBlob], { type: indexBlob.type })

  // inject CSP meta tag in all html files
  for (let k in files) {
    if (k.endsWith('.html') || k.endsWith('.htm')) {
      const pageBuffer = await files[k].arrayBuffer()
      const safePageBuffer = injectCSPMetaTagIntoBuffer(pageBuffer)
      files[k] = new Blob([safePageBuffer], {
        type: indexBlob.type,
      })
    }
  }

  // reformat
  files = Object.entries(files).map((file) => {
    console.debug('Entry: ', file)
    return {
      path: file[0],
      blob: file[1],
    }
  })

  // remove top level dir
  files = files.filter((f) => f.path !== '')

  return files
}

export async function unzipBuffer(buffer) {
  console.debug('Unzipping buffer')
  let entries = fflate.unzipSync(buffer)
  entries = Object.entries(entries).map((entry) => {
    console.debug('Entry: ', entry)
    return {
      path: entry[0],
      buffer: entry[1],
    }
  })

  // Find root dir
  let rootDir = null
  for (const entry of entries) {
    const filename = entry.path.replace(/^.*[\\/]/, '')
    if (filename === 'index.html') {
      const matchRoot = entry.path.match(/.*\//) || '/'
      if (matchRoot.length > 0) {
        console.debug('Found root dir: ', matchRoot[0])
        rootDir = matchRoot[0]
      }
      break
    }
  }

  if (rootDir === null) {
    const msg = 'No index.html file found!'
    throw new Error(msg)
  }

  console.debug('Creating file map')
  // Create files map
  const files = {}
  entries.forEach((entry, index) => {
    const relPath =
      rootDir === '/' ? entry.path : entry.path.replace(`${rootDir}`, '')
    console.debug('Entry relPath: ', relPath)
    let type
    if (
      entry.buffer.length === 0 &&
      (entry.path.endsWith('/') || !entry.path)
    ) {
      type = MIMETYPE.DIRECTORY
    } else {
      type = mime.lookup(entry.path)
    }

    files[relPath] = new Blob([entry.buffer], {
      type,
    })
  })

  return files
}

export function injectCSPMetaTagIntoDataURI(dataURI) {
  // data URI -> HTML
  const prefix = 'data:text/html;base64,'
  const base64 = dataURI.replace(prefix, '')
  const html = atob(base64)

  // inject CSP meta tag
  const safeHTML = injectCSPMetaTagIntoHTML(html)

  // HTML -> data URI
  return `${prefix}${btoa(safeHTML)}`
}

export function injectCSPMetaTagIntoBuffer(buffer) {
  // buffer -> HTML
  const html = new TextDecoder().decode(buffer)

  // inject CSP meta tag
  const safeHTML = injectCSPMetaTagIntoHTML(html)

  // HTML -> buffer
  return new TextEncoder().encode(safeHTML)
}

export function injectCSPMetaTagIntoHTML(html) {
  // HTML -> doc
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')

  // remove any existing CSP meta tags
  const existing = doc.head.querySelectorAll(
    'meta[http-equiv="Content-Security-Policy"]'
  )
  if (existing.length) {
    for (const element of existing) {
      element.remove()
    }
  }

  if (!doc.head) {
    const msg = 'index.html is missing <head> tag!'
    window.alert(msg)
    throw new Error(msg)
  }

  // inject CSP meta tag
  doc.head.insertAdjacentHTML(
    'afterbegin',
    `
    <meta http-equiv="Content-Security-Policy" content="
    upgrade-insecure-requests;
    default-src
      'none';
    frame-src
      'self';
    child-src
      'self'
      'unsafe-inline'
      blob:;
    script-src
      'self'
      'unsafe-inline'
      'unsafe-eval'
      blob:;
    style-src
      'self'
      'unsafe-inline';
    img-src
      'self'
      'unsafe-inline'
      data:
      blob:
      https://services.tzkt.io
      https://cloudflare-ipfs.com/
      https://ipfs.io/
      https://templewallet.com/logo.png
      https://gateway.pinata.cloud/;
    font-src
      'self'
      data:
      https://cloudflare-ipfs.com/
      https://fonts.googleapis.com/
      https://ipfs.io/
      https://gateway.pinata.cloud/;
    connect-src
      'self'
      https://better-call.dev
      https://*.better-call.dev
      https://*.cryptonomic-infra.tech
      https://cryptonomic-infra.tech
      blob:
      data:
      ws:
      wss:
      bootstrap.libp2p.io
      preload.ipfs.io
      https://mainnet.smartpy.io
      https://mainnet-tezos.giganode.io
      https://api.etherscan.io
      https://api.thegraph.com
      https://*.tzkt.io
      https://api.hicdex.com
      https://hdapi.teztools.io
      https://api.teia.rocks
      https://data.objkt.com
      https://api.tzstats.com
      https://*.wikidata.org
      https://*.coinmarketcap.com
      https://api.openweathermap.org
      https://hicetnunc.xyz
      https://*.hicetnunc.xyz
      https://teia.art
      https://*.teia.art
      https://*.hicetnunc.art
      https://*.teztools.io;
    manifest-src
      'self';
    base-uri
      'self';
    form-action
      'none';
    media-src
      'self'
      'unsafe-inline'
      data:
      blob:
      https://cloudflare-ipfs.com/
      https://ipfs.io/
      https://gateway.pinata.cloud/;
    prefetch-src
      'self'
      https://cloudflare-ipfs.com/
      https://fonts.googleapis.com/
      https://ipfs.io/
      https://gateway.pinata.cloud/;
    worker-src
      'self'
      'unsafe-inline'
      blob:;">
  `
  )

  // doc -> HTML
  return `<!DOCTYPE html><html>${doc.documentElement.innerHTML}</html>`
}

export function getCoverImagePathFromBuffer(buffer) {
  // buffer -> html
  const html = new TextDecoder().decode(buffer)

  // html -> doc
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')

  return getCoverImagePathFromDoc(doc)
}

function getCoverImagePathFromDoc(doc) {
  let meta = doc.head.querySelector('meta[property="cover-image"]')
  if (!meta) {
    meta = doc.head.querySelector('meta[property="og:image"]')
  }

  if (!meta) return null

  return meta.getAttribute('content')
}

export async function validateFiles(files) {
  // check for index.html file
  if (!files['index.html']) {
    return {
      valid: false,
      error: 'Missing index.html file',
    }
  }

  const pageBlob = files['index.html']
  let htmlString = await pageBlob.text()
  const parser = new DOMParser()
  const doc = parser.parseFromString(htmlString, 'text/html')

  // check for <head> tag
  if (!doc.head) {
    return {
      valid: false,
      error:
        'Missing <head> tag in index.html. Please refer to the Interactive OBJKTs Guide..',
    }
  }

  return {
    valid: true,
  }
}

export function dataRUIToBuffer(dataURI) {
  const parts = dataURI.split(',')
  const base64 = parts[1]
  const binaryStr = atob(base64)
  const len = binaryStr.length
  const bytes = new Uint8Array(len)
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryStr.charCodeAt(i)
  }
  return bytes
}
