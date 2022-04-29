import { gql } from 'graphql-request'
import uniqBy from 'lodash/uniqBy'
import TokenFeed from './TokenFeed'

function MimeTypeFeed({ namespace, mimeTypes }) {
  return (
    <TokenFeed
      namespace={namespace}
      postProcessTokens={(tokens) => uniqBy(tokens, 'creator_id')}
      query={gql`
        query getTokensByMimeTypes($limit: Int!) {
          token(where: { mime: {_in : [${mimeTypes
            .map((mimeType) => `"${mimeType}"`)
            .join(
              ', '
            )}] }, supply : { _neq : 0 }}, order_by: {id: desc}, limit: $limit) {
            id
            artifact_uri
            display_uri
            mime
            creator_id
            creator {
              name
              address
            }
          }
        }
      `}
    />
  )
}

export default MimeTypeFeed

export function GlbFeed() {
  return <MimeTypeFeed namespace="glb-feed" mimeTypes={['model/gltf-binary']} />
}

export function MusicFeed() {
  return (
    <MimeTypeFeed
      namespace="music-feed"
      mimeTypes={['audio/ogg', 'audio/wav', 'audio/mpeg']}
    />
  )
}

export function VideoFeed() {
  return <MimeTypeFeed namespace="video-feed" mimeTypes={['video/mp4']} />
}

export function HtmlSvgFeed() {
  return (
    <MimeTypeFeed
      namespace="html-svg-feed"
      mimeTypes={['application/x-directory', 'image/svg+xml']}
    />
  )
}

export function GifFeed() {
  return <MimeTypeFeed namespace="gif-feed" mimeTypes={['image/gif']} />
}
