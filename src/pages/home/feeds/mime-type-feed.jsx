import { gql } from 'graphql-request'
import uniqBy from 'lodash/uniqBy'
import { BaseTokenFieldsFragment } from '@data/api'
import { HEN_CONTRACT_FA2, FEED_MIMETYPES } from '@constants'
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
      mimeTypes={FEED_MIMETYPES.threeD}
    />
  )
}

export function AudioFeed() {
  return (
    <MimeTypeFeed
      label="Audio OBJKTs"
      namespace="audio-feed"
      mimeTypes={FEED_MIMETYPES.audio}
    />
  )
}

export function MidiFeed() {
  return (
    <MimeTypeFeed
      label="Midi OBJKTs"
      namespace="midi-feed"
      mimeTypes={FEED_MIMETYPES.midi}
    />
  )
}
export function VideoFeed() {
  return (
    <MimeTypeFeed
      label="Video OBJKTs"
      namespace="video-feed"
      mimeTypes={FEED_MIMETYPES.video}
    />
  )
}

export function PdfFeed() {
  return (
    <MimeTypeFeed
      label="PDF OBJKTs"
      namespace="pdf-feed"
      mimeTypes={FEED_MIMETYPES.pdf}
    />
  )
}

export function MarkdownFeed() {
  return (
    <MimeTypeFeed
      label="Markdown OBJKTs"
      namespace="md-feed"
      mimeTypes={FEED_MIMETYPES.markdown}
    />
  )
}

export function TextFeed() {
  return (
    <MimeTypeFeed
      label="Text OBJKTs"
      namespace="txt-feed"
      mimeTypes={FEED_MIMETYPES.text}
    />
  )
}

export function ImageFeed() {
  return (
    <MimeTypeFeed
      label="Image OBJKTs"
      namespace="image-feed"
      mimeTypes={FEED_MIMETYPES.image}
    />
  )
}

export function HtmlSvgFeed() {
  return (
    <MimeTypeFeed
      label="Interactive OBJKTs (HTML or SVG)"
      namespace="html-svg-feed"
      mimeTypes={FEED_MIMETYPES.code}
    />
  )
}

export function GifFeed() {
  return (
    <MimeTypeFeed
      label="GIF OBJKTs"
      namespace="gif-feed"
      mimeTypes={FEED_MIMETYPES.gif}
    />
  )
}
