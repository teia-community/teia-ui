import { gql } from 'graphql-request'
import uniqBy from 'lodash/uniqBy'
import { BaseTokenFieldsFragment } from '@data/api'
import { HEN_CONTRACT_FA2 } from '@constants'
import TokenCollection from '@atoms/token-collection'

function MimeTypeFeed({ label, namespace, mimeTypes }) {
  return (
    <TokenCollection
      feeds_menu
      label={label}
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
  return (
    <MimeTypeFeed
      label="3D OBJKTs"
      namespace="glb-feed"
      mimeTypes={['model/gltf-binary']}
    />
  )
}

export function AudioFeed() {
  return (
    <MimeTypeFeed
      label="Audio OBJKTs"
      namespace="audio-feed"
      mimeTypes={[
        'audio/ogg',
        'audio/wav',
        'audio/mpeg',
        'audio/vorbis',
        'audio/mp4',
      ]}
    />
  )
}

export function VideoFeed() {
  return (
    <MimeTypeFeed
      label="Video OBJKTs"
      namespace="video-feed"
      mimeTypes={['video/mp4']}
    />
  )
}

export function PdfFeed() {
  return (
    <MimeTypeFeed
      label="PDF OBJKTs"
      namespace="pdf-feed"
      mimeTypes={['application/pdf']}
    />
  )
}

export function MarkdownFeed() {
  return (
    <MimeTypeFeed
      label="Markdown OBJKTs"
      namespace="md-feed"
      mimeTypes={['text/markdown']}
    />
  )
}

export function ImageFeed() {
  return (
    <MimeTypeFeed
      label="Image OBJKTs"
      namespace="image-feed"
      mimeTypes={['image/jpeg', 'image/png', 'image/jpg']}
    />
  )
}

export function HtmlSvgFeed() {
  return (
    <MimeTypeFeed
      label="Interactive OBJKTs (HTML or SVG)"
      namespace="html-svg-feed"
      mimeTypes={['application/x-directory', 'image/svg+xml']}
    />
  )
}

export function GifFeed() {
  return (
    <MimeTypeFeed
      label="GIF OBJKTs"
      namespace="gif-feed"
      mimeTypes={['image/gif']}
    />
  )
}
