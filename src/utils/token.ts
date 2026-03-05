import { HashToURL } from '@utils'

interface TokenForPreview {
  mime_type?: string
  artifact_uri?: string
  display_uri?: string
  teia_meta?: {
    preview_uri?: string
  }
}

/**
 * Returns the best preview URL for a token based on its mime type.
 * Images use artifact_uri (full quality), everything else uses display_uri or preview_uri.
 */
export function getTokenPreviewUrl(token: TokenForPreview): string {
  const mime = token.mime_type || ''

  if (mime.startsWith('image/')) {
    return token.artifact_uri ? HashToURL(token.artifact_uri) : ''
  }

  // 3D models prefer teia_meta.preview_uri
  if (mime.startsWith('model/')) {
    const previewUri = token.teia_meta?.preview_uri
    if (previewUri) return HashToURL(previewUri)
  }

  // Everything else (video, audio, html/zip, text, pdf) uses display_uri
  return token.display_uri ? HashToURL(token.display_uri) : ''
}
