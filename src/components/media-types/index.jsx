import { useState } from 'react'
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

/**
 * @typedef {{address:string,name:string}} Wallet
 */

/**
 * Method that handles the rendering of any of the supported
 * media types.
 */

/**
 * @param {import("@types").RenderMediaProps} renderOptions - The options for the media renderer

 */
export const RenderMediaType = ({
  nft,
  previewUri,
  previewDisplayUri,
  displayView,
}) => {
  const [forceArtifact, setForceArtifact] = useState(false)
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

  const parsedDisplayUri = useMemo(() => {
    if (previewDisplayUri) {
      return previewDisplayUri
    }
    if (nft.display_uri)
      return HashToURL(nft.display_uri, 'CDN', { size: 'raw' })

    if (nft.mime_type?.startsWith('video')) {
      setForceArtifact(true)
      return HashToURL(nft.artifact_uri, 'CDN', { size: 'raw' })
    }
  }, [nft, previewDisplayUri])

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
    return
  }

  switch (nft.mime_type) {
    /* IMAGES */
    case MIMETYPE.BMP:
    case MIMETYPE.GIF:
    case MIMETYPE.JPEG:
    case MIMETYPE.PNG:
    case MIMETYPE.TIFF:
    case MIMETYPE.WEBP:
      return (
        <Container displayView={displayView} nft={nft}>
          <ImageComponent
            artifactUri={parsedArtifactUri}
            displayUri={parsedDisplayUri}
            displayView={displayView}
            previewUri={previewUri}
            nft={nft}
          />
        </Container>
      )

    /* VECTOR */
    case MIMETYPE.SVG:
      return (
        <Container displayView={displayView} nft={nft}>
          <VectorComponent
            artifactUri={parsedArtifactUri}
            displayUri={parsedDisplayUri}
            displayView={displayView}
            previewUri={previewUri}
            nft={nft}
          />
        </Container>
      )

    /* HTML ZIP */
    case MIMETYPE.DIRECTORY:
    case MIMETYPE.ZIP:
    case MIMETYPE.ZIP1:
    case MIMETYPE.ZIP2:
      return (
        <Container displayView={displayView} nft={nft}>
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
        </Container>
      )
    /* VIDEOS */
    case MIMETYPE.MP4:
    case MIMETYPE.OGV:
    case MIMETYPE.QUICKTIME:
    case MIMETYPE.WEBM:
      return (
        <Container displayView={displayView} nofullscreen nft={nft}>
          <VideoComponent
            artifactUri={parsedArtifactUri}
            displayUri={parsedDisplayUri}
            displayView={displayView}
            previewUri={previewUri}
            nft={nft}
            forceVideo={forceArtifact}
          />
        </Container>
      )
    /* 3D */
    case MIMETYPE.GLB:
    case MIMETYPE.GLTF:
      return (
        <Container displayView={displayView} nft={nft}>
          <GLBComponent
            artifactUri={parsedArtifactUri}
            displayUri={parsedDisplayUri}
            displayView={displayView}
            previewUri={previewUri}
            nft={nft}
          />
        </Container>
      )
    /* AUDIO */
    case MIMETYPE.MP3:
    case MIMETYPE.OGA:
    case MIMETYPE.FLAC:
    case MIMETYPE.WAV:
    case MIMETYPE.XWAV:
      return (
        <Container displayView={displayView} nft={nft}>
          <AudioComponent
            artifactUri={parsedArtifactUri}
            displayUri={parsedDisplayUri}
            displayView={displayView}
            previewUri={previewUri}
            nft={nft}
          />
        </Container>
      )
    /* PDF */
    case MIMETYPE.PDF:
      return (
        <Container displayView={displayView} nft={nft}>
          <PdfComponent
            artifactUri={parsedArtifactUri}
            displayUri={parsedDisplayUri}
            displayView={displayView}
            previewUri={previewUri}
            nft={nft}
          />
        </Container>
      )

    case MIMETYPE.MD:
      return (
        <Container displayView={displayView} nft={nft}>
          <MD
            artifactUri={parsedArtifactUri}
            displayUri={parsedDisplayUri}
            displayView={displayView}
            previewUri={previewUri}
            nft={nft}
          />
        </Container>
      )

    default:
      return <UnknownComponent mimeType={nft.mime_type} />
  }
}
