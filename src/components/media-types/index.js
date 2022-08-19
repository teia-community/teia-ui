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
import { HashToURL } from '@utils'

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
  objkt,

  // if the NFT is on the objkt detail page this value is true. otherwise is false
  interactive = false,

  // when previewing during mint process
  preview = false,

  displayView,
}) => {
  const parsedArtifactUri = artifactUri ? HashToURL(artifactUri) : ''
  const parsedDisplayUri = displayUri ? HashToURL(displayUri) : ''
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
          />
        </Container>
      )

    /* VECTOR */
    case MIMETYPE.SVG:
      return (
        <Container interactive={interactive}>
          <VectorComponent
            artifactUri={parsedArtifactUri}
            displayUri={parsedDisplayUri}
            previewUri={previewUri}
            preview={preview}
            creator={creator}
            objkt={objkt}
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
            artifactUri={parsedArtifactUri}
            displayUri={parsedDisplayUri}
            previewUri={previewUri}
            creator={creator}
            objkt={objkt}
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
          />
        </Container>
      )
    /* PDF */
    case MIMETYPE.PDF:
      return (
        <Container interactive={interactive}>
          <PdfComponent
            artifactUri={parsedArtifactUri}
            displayUri={parsedDisplayUri}
            previewUri={previewUri}
            preview={preview}
            onDetailView={interactive}
            displayView={displayView}
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
        />
      )

    default:
      return <UnknownComponent mimeType={mimeType} />
  }
}
