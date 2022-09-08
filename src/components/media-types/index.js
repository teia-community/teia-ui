import React from 'react'
import { GLBComponent } from './glb'
import { ImageComponent } from './image'
import { VideoComponent } from './video'
import { AudioComponent } from './audio'
import { VectorComponent } from './vector'
import { HTMLComponent } from './html'
import { UnknownComponent } from './unknown'
import { PdfComponent } from './pdf'
import { MIMETYPE } from '@constants'
import { Container } from './container'
import { MD } from './md'
import { HashToURL } from 'utils/index'

/**
 * @typedef {{address:string,name:string}} Wallet
 */

/**
 * @typedef {Object} NFT
 * @property {number} [id] - the objkt id
 * @property {string} [creator] - the creator tz address
 * @property {string} mimeType - the mimetype of the token metadata
 * @property {string} artifact_uri - the artifact IPFS URI
 * @property {string} display_uri - the display IPFS URI a.k.a cover image
 */

/**
 * Method that handles the rendering of any of the supported
 * media types.
 * @param {NFT} nft - The nft object
 * @param {boolean} [preview=false] - True if we are on the mint preview page
 * @param {boolean} [previewUri] - True if we are on the mint preview page
 * @param {boolean} [interactive] - Unsure?
 * @param {boolean} [displayView] - Unsure?
 */
export const renderMediaType = ({
  nft,
  preview = false,
  previewUri,
  interactive = false,
  displayView,
}) => {
  if (!nft) {
    console.error('No nft to render')
    return
  }

  const parsedArtifactUri = nft.artifact_uri
    ? HashToURL(nft.artifact_uri, 'CDN', { size: 'raw' })
    : ''
  const parsedDisplayUri = nft.display_uri
    ? HashToURL(nft.display_uri, 'CDN', { size: 'medium' })
    : ''

  const parsedArtifactGatewayUri = nft.artifact_uri
    ? HashToURL(nft.artifact_uri, 'NFTSTORAGE')
    : ''
  // Due to issues for generative tokens on NFTStorage.link gateway
  // we use ipfs.io only for these
  const parsedArtifactHtmlUri = nft.artifact_uri
    ? HashToURL(nft.artifact_uri, 'IPFS')
    : ''

  switch (nft.mime) {
    /* IMAGES */
    case MIMETYPE.BMP:
    case MIMETYPE.GIF:
    case MIMETYPE.JPEG:
    case MIMETYPE.PNG:
    case MIMETYPE.TIFF:
    case MIMETYPE.WEBP:
      return (
        <Container interactive={interactive}>
          <ImageComponent
            artifactUri={parsedArtifactUri}
            displayUri={parsedDisplayUri}
            previewUri={previewUri}
            onDetailView={interactive || nft.mimeType === MIMETYPE.GIF}
            preview={preview}
            displayView={displayView}
            nft={nft}
          />
        </Container>
      )

    /* VECTOR */
    case MIMETYPE.SVG:
      return (
        <Container interactive={interactive}>
          <VectorComponent
            artifactUri={parsedArtifactHtmlUri}
            displayUri={parsedDisplayUri}
            previewUri={previewUri}
            preview={preview}
            creator={nft.creator}
            objktID={nft.id}
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
        <Container interactive={interactive}>
          <HTMLComponent
            artifactUri={parsedArtifactHtmlUri}
            displayUri={parsedDisplayUri}
            previewUri={previewUri}
            creator={nft.creator}
            objktID={nft.id}
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
        <Container interactive={interactive} nofullscreen>
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
        <Container interactive={interactive}>
          <GLBComponent
            artifactUri={parsedArtifactUri}
            displayUri={parsedDisplayUri}
            previewUri={previewUri}
            preview={preview}
            onDetailView={interactive}
            displayView={displayView}
            objktID={nft.id}
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
        <Container interactive={interactive}>
          <AudioComponent
            artifactUri={parsedArtifactUri}
            displayUri={parsedDisplayUri}
            previewUri={previewUri}
            preview={preview}
            onDetailView={interactive}
            displayView={displayView}
            objktID={nft.id}
          />
        </Container>
      )
    /* PDF */
    case MIMETYPE.PDF:
      return (
        <Container interactive={interactive}>
          <PdfComponent
            artifactUri={parsedArtifactGatewayUri}
            fallbackUri={parsedArtifactHtmlUri}
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
          objktID={nft.id}
        />
      )

    default:
      return <UnknownComponent mimeType={nft.mimeType} />
  }
}
