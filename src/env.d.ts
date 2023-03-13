/// <reference types="vite/client" />
/// <reference types="vite-plugin-svgr/client" />

declare module '*.md' {
  // "unknown" would be more detailed depends on how you structure frontmatter
  const attributes: Record<string, unknown>

  // When "Mode.React" is requested. VFC could take a generic like React.VFC<{ MyComponent: TypeOfMyComponent }>
  import React from 'react'
  const ReactComponent: React.VFC

  // Modify below per your usage
  export { attributes, ReactComponent }
}

interface ImportMetaEnv {
  /** base url for the report lists */
  readonly VITE_TEIA_REPORT: string
  /** url to the raw dist folder on teia-logo repository*/
  readonly VITE_LOGOS: string
  /** the graphql endpoint of the indexer (teztok instance) */
  readonly VITE_TEIA_GRAPHQL_API: string
  /** the base url of the tzkt API */
  readonly VITE_TZKT_API: string
  readonly VITE_TZPROFILES_GRAPHQL_API: string
  readonly VITE_IMGPROXY: string
  readonly VITE_IPFS_UPLOAD_PROXY: string
  readonly VITE_IPFS_DEFAULT_GATEWAY:
    | 'CDN'
    | 'CLOUDFLARE'
    | 'PINATA'
    | 'IPFS'
    | 'DWEB'
    | 'NFTSTORAGE'
  readonly VITE_TEZOS_RPC: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
