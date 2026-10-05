import { HashToURL } from '@utils'
import { IPFS_DEFAULT_THUMBNAIL_URI } from '@constants'

interface ThumbnailSource {
  displayUri?: string
  thumbnailUri?: string
  artifactUri?: string
  mimeType?: string
}

/**
 * Image URL for a token on the copyright pages, served through Teia's CDN
 * (the public ipfs.io gateway answers 403, which left every thumbnail broken).
 *
 * Prefers the display image. Most HEN tokens carry the same generic default
 * thumbnail, so that one is skipped; the artifact is used only when it is an
 * image (or its type is unknown). Returns '' when there is nothing to show.
 */
export function copyrightThumbnail(meta?: ThumbnailSource | null): string {
  if (!meta) return ''
  const thumbnail =
    meta.thumbnailUri && meta.thumbnailUri !== IPFS_DEFAULT_THUMBNAIL_URI
      ? meta.thumbnailUri
      : undefined
  const artifact =
    meta.artifactUri && (!meta.mimeType || meta.mimeType.startsWith('image/'))
      ? meta.artifactUri
      : undefined
  const uri = meta.displayUri || thumbnail || artifact
  return uri ? HashToURL(uri, 'CDN') : ''
}

/**
 * `onError` for those images: Teia's CDN only holds files it has cached (works
 * from other contracts can be missing), so retry once through another gateway.
 */
export function retryThumbnail(event: { currentTarget: HTMLImageElement }) {
  const img = event.currentTarget
  const cid = img.src.split('/ipfs/')[1]
  if (!cid || img.dataset.retried) return
  img.dataset.retried = '1'
  img.src = `https://gateway.pinata.cloud/ipfs/${cid}`
}
