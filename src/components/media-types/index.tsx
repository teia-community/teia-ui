import { HashToURL } from '@utils'
import { MIMETYPE } from '@constants'

import { GLBComponent } from './glb'
import { ImageComponent } from './image'
import { VideoComponent } from './video'
import { AudioComponent } from './audio'
import { VectorComponent } from './vector'
import { HTMLComponent } from './html'
import { UnknownComponent } from './unknown'
import { PdfComponent } from './pdf'
import { Container } from './container'
import { MD } from './md'
import { useMemo } from 'react'
import { NFT } from '@types'

interface RenderMediaTypeProps {
  /**The nft with the core fragments*/
  nft: NFT
  /**When minting this is a base64 (or ObjectURL) representation of the image/video */
  previewUri?: string
  /**When minting this is a base64 (or ObjectURL) representation of the cover image/video */
  previewDisplayUri?: string
  /**false on feeds, true on objkt detail view. */
  displayView?: boolean
  /**hacky way to pass the details hover for now... */
  details?: JSX.Element | JSX.Element[]
}

/**
 * Method that handles the rendering of any of the supported media types.
 */
export const RenderMediaType = ({
  nft,
  previewUri,
  previewDisplayUri,
  displayView,
  details,
}: RenderMediaTypeProps) => {
  const parsedArtifactUri = useMemo(
    () =>
      nft.artifact_uri
        ? HashToURL(nft.artifact_uri, 'CDN', { size: 'raw' })
        : '',
    [nft]
  )
  if (!nft) {
    throw Error(`No OBJKT to render`)
  }
  if (nft.metadata_status === 'unprocessed') {
    throw Error(`The OBJKT #${nft.token_id} is being processed`, {
      cause: 'Processing Metadata',
    })
  }

  const forceArtifact = useMemo(() => {
    if (!nft.display_uri && nft.mime_type?.startsWith('video')) {
      return true
    }
    return false
  }, [nft])

  const parsedDisplayUri = useMemo(() => {
    if (previewDisplayUri) {
      return previewDisplayUri
    }
    if (nft.display_uri)
      return HashToURL(nft.display_uri, 'CDN', { size: 'raw' })

    if (nft.mime_type?.startsWith('video')) {
      return HashToURL(nft.artifact_uri, 'CDN', { size: 'raw' })
    }
  }, [nft, previewDisplayUri])

  const Media = useMemo(() => {
    switch (nft.mime_type) {
      /* IMAGES */
      case MIMETYPE.BMP:
      case MIMETYPE.GIF:
      case MIMETYPE.JPEG:
      case MIMETYPE.PNG:
      case MIMETYPE.TIFF:
      case MIMETYPE.WEBP:
        return (
          <ImageComponent
            artifactUri={parsedArtifactUri}
            displayUri={parsedDisplayUri}
            displayView={displayView}
            previewUri={previewUri}
            nft={nft}
          />
        )

      /* VECTOR */
      case MIMETYPE.SVG:
        return (
          <VectorComponent
            artifactUri={parsedArtifactUri}
            displayUri={parsedDisplayUri}
            displayView={displayView}
            previewUri={previewUri}
            nft={nft}
          />
        )

      /* HTML ZIP */
      case MIMETYPE.DIRECTORY:
      case MIMETYPE.ZIP:
      case MIMETYPE.ZIP1:
      case MIMETYPE.ZIP2:
        return (
          <HTMLComponent
            // artistAddress={nft.artist_address}
            // creator={nft.creator}
            // objktID={nft.token_id}
            artifactUri={parsedArtifactUri}
            displayUri={parsedDisplayUri}
            displayView={displayView}
            previewUri={previewUri}
            nft={nft}
          />
        )
      /* VIDEOS */
      case MIMETYPE.MP4:
      case MIMETYPE.OGV:
      case MIMETYPE.QUICKTIME:
      case MIMETYPE.WEBM:
        return (
          <VideoComponent
            artifactUri={parsedArtifactUri}
            displayUri={parsedDisplayUri}
            displayView={displayView}
            previewUri={previewUri}
            nft={nft}
            forceVideo={forceArtifact}
          />
        )
      /* 3D */
      case MIMETYPE.GLB:
      case MIMETYPE.GLTF:
        return (
          <GLBComponent
            artifactUri={parsedArtifactUri}
            displayUri={parsedDisplayUri}
            displayView={displayView}
            previewUri={previewUri}
            nft={nft}
          />
        )
      /* AUDIO */
      case MIMETYPE.MP3:
      case MIMETYPE.OGA:
      case MIMETYPE.FLAC:
      case MIMETYPE.WAV:
      case MIMETYPE.XWAV:
        return (
          <AudioComponent
            artifactUri={parsedArtifactUri}
            displayUri={parsedDisplayUri}
            displayView={displayView}
            previewUri={previewUri}
            nft={nft}
          />
        )
      /* PDF */
      case MIMETYPE.PDF:
        return (
          <PdfComponent
            artifactUri={parsedArtifactUri}
            displayUri={parsedDisplayUri}
            displayView={displayView}
            previewUri={previewUri}
            nft={nft}
          />
        )

      case MIMETYPE.MD:
        return (
          <MD
            artifactUri={parsedArtifactUri}
            displayUri={parsedDisplayUri}
            displayView={displayView}
            previewUri={previewUri}
            nft={nft}
          />
        )

      default:
        return <UnknownComponent mimeType={nft.mime_type} />
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nft.mime_type])

  if (nft.metadata_status === 'error') {
    const err = Error(
      `The OBJKT #${nft.token_id} failed to index, 
      if this persists for more than a day please log an issue.`,
      {
        cause: 'Metadata Error',
      }
    )
    console.error(err)
    // throw err
    return null
  }

  return (
    <Container displayView={displayView} nft={nft}>
      {details}

      {Media}
    </Container>
  )
}
