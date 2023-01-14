import React from 'react'
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
 * @param {Object} renderOptions - The options for the media renderer
 * @param {import("@types").NFT} renderOptions.nft - The nft to render
 * @param {boolean} renderOptions.preview
 * @param {string} renderOptions.previewUri
 * @param {boolean} renderOptions.interactive
 * @param {boolean} renderOptions.displayView - use the display/preview image
 *
 */
export const RenderMediaType = ({
  nft,
  preview,
  previewUri,
  interactive,
  displayView,
}) => {
  const parsedArtifactUri = useMemo(
    () =>
      nft.artifact_uri
        ? HashToURL(nft.artifact_uri, 'CDN', { size: 'raw' })
        : '',
    [nft]
  )
  const parsedDisplayUri = useMemo(
    () =>
      nft.display_uri ? HashToURL(nft.display_uri, 'CDN', { size: 'raw' }) : '',
    [nft]
  )

  if (!nft) {
    console.error('No nft to render')
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
        <Container interactive={interactive} nft={nft}>
          <ImageComponent
            artifactUri={parsedArtifactUri}
            displayUri={parsedDisplayUri}
            previewUri={previewUri}
            onDetailView={interactive}
            preview={preview}
            displayView={displayView}
            nft={nft}
          />
        </Container>
      )

    /* VECTOR */
    case MIMETYPE.SVG:
      return (
        <Container interactive={interactive} nft={nft}>
          <VectorComponent
            artifactUri={parsedArtifactUri}
            displayUri={parsedDisplayUri}
            previewUri={previewUri}
            preview={preview}
            artistAddress={nft.artist_address}
            objktID={nft.token_id}
            onDetailView={interactive}
            displayView={displayView}
          />
        </Container>
      )

    /* HTML ZIP */
    case MIMETYPE.DIRECTORY:
    case MIMETYPE.ZIP:
    case MIMETYPE.ZIP1:
    case MIMETYPE.ZIP2:
      return (
        <Container interactive={interactive} nft={nft}>
          <HTMLComponent
            artifactUri={parsedArtifactUri}
            displayUri={parsedDisplayUri}
            previewUri={previewUri}
            artistAddress={nft.artist_address}
            creator={nft.creator}
            objktID={nft.token_id}
            preview={preview}
            onDetailView={interactive}
            displayView={displayView}
          />
        </Container>
      )
    /* VIDEOS */
    case MIMETYPE.MP4:
    case MIMETYPE.OGV:
    case MIMETYPE.QUICKTIME:
    case MIMETYPE.WEBM:
      return (
        <Container interactive={interactive} nofullscreen nft={nft}>
          <VideoComponent
            artifactUri={parsedArtifactUri}
            displayUri={parsedDisplayUri}
            previewUri={previewUri}
            preview={preview}
            onDetailView={interactive}
            displayView={displayView}
            nft={nft}
          />
        </Container>
      )
    /* 3D */
    case MIMETYPE.GLB:
    case MIMETYPE.GLTF:
      return (
        <Container interactive={interactive} nft={nft}>
          <GLBComponent
            artifactUri={parsedArtifactUri}
            displayUri={parsedDisplayUri}
            previewUri={previewUri}
            preview={preview}
            onDetailView={interactive}
            displayView={displayView}
            objktID={nft.token_id}
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
        <Container interactive={interactive} nft={nft}>
          <AudioComponent
            artifactUri={parsedArtifactUri}
            displayUri={parsedDisplayUri}
            previewUri={previewUri}
            preview={preview}
            onDetailView={interactive}
            displayView={displayView}
            objktID={nft.token_id}
          />
        </Container>
      )
    /* PDF */
    case MIMETYPE.PDF:
      return (
        <Container interactive={interactive} nft={nft}>
          <PdfComponent
            artifactUri={parsedArtifactUri}
            displayUri={parsedDisplayUri}
            previewUri={previewUri}
            preview={preview}
            onDetailView={interactive}
            displayView={displayView}
            nft={nft}
          />
        </Container>
      )

    case MIMETYPE.MD:
      return (
        <MD
          previewUri={previewUri}
          preview={preview}
          artifactUri={parsedArtifactUri}
          displayUri={parsedDisplayUri}
          displayView={displayView}
          objktID={nft.token_id}
        />
      )

    default:
      return <UnknownComponent mimeType={nft.mime_type} />
  }
}
