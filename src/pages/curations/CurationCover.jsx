import { useState } from 'react'
import { HashToURL } from '@utils'
import { msgIpfsToUrl } from '@data/messaging/ipfs'

/**
 * Curation Cover Helper
 * A cover is either a token image (pinned) or an uploaded
 * image (pinned on the messaging proxy).
 * Upload is hidden for now.
 */
export default function CurationCover({ uri, className, style, alt }) {
  const [failedUri, setFailedUri] = useState(null)
  const src = failedUri === uri ? msgIpfsToUrl(uri) : HashToURL(uri, 'CDN')

  return (
    <img
      className={className}
      style={style}
      src={src}
      alt={alt}
      onError={() => setFailedUri(uri)}
    />
  )
}
