/**
 * WIP
 * Basic Types used in jsdoc.
 */
// TODO(mel): Cleanup and complete
export enum ListingType {
  TEIA,
  HEN,
  OBJK,
  VERSUM,
  HICETDONO,
}

export enum EventType {
  HEN_MINT,
  TEIA_SWAP,
  HEN_SWAP,
  HEN_SWAP_V2,
  VERSUM_SWAP,
  FA2_TRANSFER,
}

export type TeiaMeta = {
  accessibility: string
  content_rating: string
  is_signed: boolean
  preview_uri: string
}

export type Shareholder = {
  contract_address: string
  shareholder_address: string
  shares: string
  holder_type: ShareholderType
}

export type SplitContract = {
  contract_address: string
  administrator_address: string
  total_shares: string
}

export type Signature = {
  fa2_address: string
  token_id: string
  shareholder_address: string
}

export type ListingStatus = {}

export type Listing = {
  amount_left: number
  amount: number
  ask_id: string
  swap_id: string
  offer_id: string
  contract_address: string
  key: string
  /** The price in mutez */
  price: number
  seller_address: string
  seller_profile: string
  status: ListingStatus
  type: ListingType
}
export type RoyaltyReceiver = {
  receiver_address: string
  royalties: string
}

export type NFT = {
  /** the token id */
  token_id: string
  /** The fa2 address? */
  fa2_address: string
  name?: string
  description?: string
  minted_at: string
  thumbnail_uri?: string
  display_uri?: string
  artifact_uri: string
  royalties?: string
  royalty_receivers?: [RoyaltyReceiver]

  /** the creator tz address */
  creator: string
  /** the mimetype of the token metadata */
  mime_type: string
  /** the artifact IPFS URI */
  artifact_uri: string
  /** the display IPFS URI a.k.a cover image */
  display_uri: string
  /** List of addresses owning that token */
  token_holders: [string]

  teia_meta?: TeiaMeta

  listings: [Listing]

  artist_address: string
  artist_profile: ArtistProfile
  teia_meta: TeiaMeta
  price: number
}

export type ArtistProfile = {
  name?: string
  is_split: boolean
}

export type FeedEvent = {
  title: string
  /** The tag line */
  subtitle?: string
  /** Either an emoji or an Icon component */
  icon?: string
  /** markdown string */
  content: string
  /** external link */
  link: string
}
