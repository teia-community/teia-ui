/// <reference types="vite/client" />

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
