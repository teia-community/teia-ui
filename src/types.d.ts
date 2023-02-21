export interface Format {
  mimeType: string
  fileSize: number
  fileName: string
  dimensions?: {
    value: string
    unit: string
  }
}

export type MintFormat = {
  mimeType: string
  fileSize: number
  fileName: string
  dimensions: {
    value: string
    unit: string
  }
  uri: string
}

export type FileMint = {
  path: string
  blob: Blob
  size?: number
}

export type FileForm = {
  /** The title of the file */
  title?: string
  /** The file mimetype */
  mimeType: string
  /** The file object */
  file?: File
  /** The buffer extracted from the file. */
  buffer: ArrayBuffer
  /** The file reader*/
  reader: string | ArrayBuffer | null
  format?: Format
}
export type UploadCallback = (arg: FileMint) => void

/**
 * WIP
 * Basic Types used in jsdoc.
 */
// TODO(mel): Cleanup and complete

/** Enum of supported listing types */
// export enum ListingType {
//   TEIA = 'TEIA',
//   HEN = 'HEN',
//   OBJK = 'OBJK',
//   VERSUM = 'VERSUM',
//   HICETDONO = 'HICETDONO',
// }

// export enum EventType {
//   HEN_MINT,
//   TEIA_SWAP,
//   HEN_SWAP,
//   HEN_SWAP_V2,
//   VERSUM_SWAP,
//   FA2_TRANSFER,
// }

export type ListingType =
  | 'TEIA_SWAP'
  | 'HEN_SWAP'
  | 'HEN_SWAP_V2'
  | 'OBJKT_ASK'
  | 'OBJKT_ASK_V2'
  | 'VERSUM_SWAP'
export type MetadataAccessibility = {
  /** resource that is physiologically dangerous to some users.*/
  hazards: string[]
}
export type TeiaMeta = {
  /** Accessibility metadatas */
  accessibility: MetadataAccessibility
  /** The content rating, for instance "mature" for nsfw.*/
  content_rating: string
  is_signed: boolean
  preview_uri: string
}

export type Shareholder = {
  // contract_address: string
  shareholder_address: string
  shareholder_profile: ArtistProfile
  shares: number
  holder_type: 'admin' | 'creator' | 'benefactor' | 'core_participant'
}

export type SplitContract = {
  contract_address?: string
  administrator_address: string
  total_shares?: string
  shareholders: Shareholder[]
}

export type Signature = {
  fa2_address?: string
  token_id?: string
  shareholder_address?: string
}

export type ListingStatus = {}

export interface Holding {
  holder_address: string
  amount: number
  holder_profile: ArtistProfile
}

export type Listing = {
  amount: number
  amount_left: number
  ask_id?: string
  contract_address: string
  end_price?: number
  key?: number
  offer_id?: string
  price: number
  seller_address: string
  seller_profile: ArtistProfile
  start_price?: number
  status: string // "active" ||
  swap_id: number
  type: ListingType
}

export type RoyaltyReceiver = {
  receiver_address: string
  royalties: [string: string][]
}

export type NFTBase = {
  /** the artifact IPFS URI */
  artifact_uri: string
  /** the display IPFS URI a.k.a cover image */
  display_uri: string
  thumbnail_uri: string
  metadata_uri: string
  metadata_status: 'processed' | 'unprocessed' | 'error'

  /** the creator tz address */
  artist_address: string
  artist_profile: ArtistProfile

  description?: string

  /** The total number of editions existing */
  editions: number

  /** The fa2 address */
  fa2_address: string

  /** Active listings */
  listings: Listing[]

  holdings: Holding[]

  /** the mimetype of the token metadata */
  mime_type: string

  minted_at: string
  name?: string
  price: number
  /** This is null for non collab tokens? */
  royalties?: [string: string][]
  royalties_total: number
  royalty_receivers?: RoyaltyReceiver[]

  teia_meta?: TeiaMeta

  /** List of addresses currently owning that token */
  token_holders?: string[]
  /** the token id */
  token_id: string

  signatures?: Signature[]
}

export interface SubjktMeta {
  identicon?: string
  description?: string
}

export interface SubjktInfo {
  userAddress: string
  name?: string
  metadata: SubjktMeta // this is actually nested in data?
}

export interface TzkTAccount {
  balance: string
}

export interface Tx {
  to_?: string
  amount?: number
  token_id: string
}

export interface TxWithIndex extends Tx {
  index: number
}

// TODO(mel): use separate NFT types depending on the stage
/** These are artifacts of TokenCollection, where the check logic happens. */
export type NFTFiltered = {
  isNSFW?: boolean
  isPhotosensitive?: boolean
}

export type NFT = NFTBase &
  NFTFiltered & {
    /** This is an artifact of ??, where the key logic happens. */
    key?: string
  } & {
    /** artifact of only objkt display for now... */
    restricted?: boolean
    /** artifact of... */
    underReview?: boolean
  }

export type TokenResponse = {
  postProcessTokens: ([NFT]) => [NFT]
  resultsPath: string
  tokenPath: string
  keyPath: string
}

export type ArtistProfile = {
  name?: string
  user_address?: string
  is_split?: boolean
  split_contract?: SplitContract
}

export type LocalSettingsContext = {
  /**The feed view mode */
  viewMode: 'single' | 'masonry'
  /**Set the feed view mode */
  setViewMode: (mode: 'single' | 'masonry') => void
  /**Delete the localstorage for the feed view mode */
  // rmViewMode: () => void
  /**Utility function to toggle the view mode*/
  toggleViewMode: () => void
  /**The NSFW preference (true == show them unblurred) */
  nsfwFriendly: boolean
  /**Set the NSFW preference*/
  setNsfwFriendly: (boolean) => void
  /**Delete the localstorage for the NSFW preference */
  rmNsfwFriendly: () => void
  /**The Photosensitive preference (true == show them unblurred) */
  photosensitiveFriendly: boolean
  /**Set the Photosensitive preference*/
  setPhotosensitiveFriendly: (boolean) => void
  /**Delete the localstorage for the Photosensitive preference */
  // rmPhotosensitiveFriendly: () => void
  /**The zen preference*/
  zen: boolean
  /**Set the zen preference*/
  setZen: (boolean) => void
  /**Delete the localstorage for the zen preference */
  // rmZen: () => void
  /**Utility function to toggle the zen preference */
  toggleZen: () => void
  /**The theme preference*/
  theme: 'light' | 'dark'
  /**Set the theme preference*/
  setTheme: (theme: 'light' | 'dark') => void
  /**Delete the localstorage for the theme preference */
  // rmTheme: () => void
  /**Utility function to toggle the current theme */
  toggleTheme: () => void
}

export type FeedEvent = {
  title: string
  /** The tag line */
  subtitle?: string
  /** Either an emoji or an Icon component */
  icon?: string
  /** A linked feed */
  feed?: string
  /** markdown string */
  content: string
  /** external link */
  link: string
}

type SharedMediaProps = {
  /**The nft to render */
  nft: NFT
  /** Preview "data" to pass to the Preview component */
  previewUri?: string
  /** Detailed view, full quality.*/
  displayView?: boolean
}
export type RenderMediaProps = SharedMediaProps

export type MediaTypeProps = SharedMediaProps & {
  /** Resolved gateway URL for the Artifact of the token */
  artifactUri?: string
  /** Resolved gateway URL for the cover image / thumbnail */
  displayUri?: string

  /** Some intersection observer setup by the media container */
  inView?: boolean

  /** Older video tokens did not require a cover image, load the video in these cases. */
  forceVideo?: boolean
}
