import { gql } from 'graphql-request'
import uniqBy from 'lodash/uniqBy'
import { BaseTokenFieldsFragment } from '@data/api'
import { HEN_CONTRACT_FA2 } from '@constants'
import TokenCollection from '@atoms/token-collection'

function MimeTypeFeed({ namespace, mimeTypes }) {
  return (
    <TokenCollection
      namespace={namespace}
      maxItems={600}
      postProcessTokens={(tokens) => uniqBy(tokens, 'artist_address')}
      query={gql`
        ${BaseTokenFieldsFragment}
        query getTokensByMimeTypes($limit: Int!) {
          tokens(where: { mime_type: {_in : [${mimeTypes
            .map((mimeType) => `"${mimeType}"`)
            .join(
              ', '
            )}] }, editions : { _neq : 0 }, metadata_status: { _eq: "processed" }, fa2_address: { _eq: "${HEN_CONTRACT_FA2}"}}, order_by: { minted_at: desc }, limit: $limit) {
              ...baseTokenFields
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

export function ImageFeed() {
  return (
    <MimeTypeFeed
      namespace="image-feed"
      mimeTypes={['image/jpeg', 'image/png', 'image/jpg']}
    />
  )
}

export function AudioFeed() {
  return (
    <MimeTypeFeed
      namespace="audio-feed"
      mimeTypes={['audio/mpeg', 'audio/vorbis', 'audio/mp4', 'audio/ogg']}
    />
  )
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
