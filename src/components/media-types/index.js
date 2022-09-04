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

/*

README:
renderMediaType requires the following props being passed individually.
Once all API have the same structure we can pass the whole object, but right now
there's a mix of GraphQL and API and they have different structures, so passing
the props one by one helps avoid bugs

MANDATORY FIELDS:
- mimeType (mimetype)
- artifactUri (ipfs link)
- displayUri (ipfs link)

OPTIONAL FIELDS:
- creator (creator wallet)
- objkt (objkt number)
- interactive (boolean)
- preview (boolean)
 */

export const renderMediaType = ({
  // the objkt mimeType (used to choose what renderer to use)
  mimeType,

  // artifactUri holds the file the user uploaded
  artifactUri,

  // displayUri might be sometimes undefined or '', but when present its a lower resolution of the artifactUri for faster loading
  displayUri,

  // previewUri is used when previewing on mint page
  previewUri,

  // the wallet id of the creator
  creator,

  // the objkt id so interactive NFT's can call API's
  objktID,

  // if the NFT is on the objkt detail page this value is true. otherwise is false
  interactive = false,

  // when previewing during mint process
  preview = false,

  displayView,
}) => {
  const size = interactive ? 'gallery' : 'medium'

  const parsedArtifactUri = artifactUri
    ? HashToURL(artifactUri, 'CDN', { size })
    : ''
  const parsedDisplayUri = displayUri
    ? HashToURL(displayUri, 'CDN', { size })
    : ''

  const parsedArtifactGatewayUri = artifactUri
    ? HashToURL(artifactUri, 'NFTSTORAGE')
    : ''
  // Due to issues for generative tokens on NFTStorage.link gateway
  // we use ipfs.io only for these
  const parsedArtifactHtmlUri = artifactUri
    ? HashToURL(artifactUri, 'IPFS')
    : ''
  const parsedDisplayHtmlUri = displayUri
    ? HashToURL(displayUri, 'CDN', { size })
    : ''

  const parsedArtifactRawUri = artifactUri
    ? HashToURL(artifactUri, 'CDN', { size: 'raw' })
    : ''

  switch (mimeType) {
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
            onDetailView={interactive || mimeType === MIMETYPE.GIF}
            preview={preview}
            displayView={displayView}
            objktID={objktID}
          />
        </Container>
      )

    /* VECTOR */
    case MIMETYPE.SVG:
      return (
        <Container interactive={interactive}>
          <VectorComponent
            artifactUri={parsedArtifactHtmlUri}
            displayUri={parsedDisplayHtmlUri}
            previewUri={previewUri}
            preview={preview}
            creator={creator}
            objktID={objktID}
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
            displayUri={parsedDisplayHtmlUri}
            previewUri={previewUri}
            creator={creator}
            objktID={objktID}
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
            objktID={objktID}
          />
        </Container>
      )
    /* 3D */
    case MIMETYPE.GLB:
    case MIMETYPE.GLTF:
      return (
        <Container interactive={interactive}>
          <GLBComponent
            artifactUri={parsedArtifactRawUri}
            displayUri={parsedDisplayUri}
            previewUri={previewUri}
            preview={preview}
            onDetailView={interactive}
            displayView={displayView}
            objktID={objktID}
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
            artifactUri={parsedArtifactRawUri}
            displayUri={parsedDisplayUri}
            previewUri={previewUri}
            preview={preview}
            onDetailView={interactive}
            displayView={displayView}
            objktID={objktID}
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
            objktID={objktID}
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
          objktID={objktID}
        />
      )

    default:
      return <UnknownComponent mimeType={mimeType} />
  }
}
