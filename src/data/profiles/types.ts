// On-chain profile card types.
//
// The teiaProfiles contract stores one profile card per wallet. Each record
// holds only current_cid / hidden / version_count; the card's name, bio,
// avatar and display settings live off-chain in the IPFS document
// (ProfileContent).

/** What an artist chose to show on their card (see pages/artists/ArtistCard). */
export interface ProfileCard {
  /** CARD_FIELDS keys to display. */
  show: string[]
  /** Free-text tags shown as chips. */
  tags: string[]
}

/** The JSON document stored on IPFS for each profile card version. */
export interface ProfileContent {
  schema_version: number
  /** Display name (free-form, not unique). */
  name?: string
  /** Bio. */
  description?: string
  /** ipfs:// URI of the avatar. */
  identicon?: string
  card?: ProfileCard
  timestamp: string
}

/** A profile record as stored in the `profiles` bigmap. */
export interface ChainProfile {
  address: string
  cid: string
  /** Banned by a moderator / multisig user: hide from public views. */
  hidden: boolean
  versionCount: number
}

/** A profile record joined with its IPFS document. */
export interface ResolvedProfile extends ChainProfile {
  /** Undefined when the IPFS fetch failed. */
  content?: ProfileContent
}
