// On-chain profile types.
//
// The teiaProfiles contract stores one profile per address. Each record holds
// only current_cid / handle / moderated / version_count; the display name,
// description, avatar and artist card configuration live off-chain in the
// IPFS profile document (ProfileContent).

/** What an artist chose to show on their card (see pages/artists/ArtistCard). */
export interface ProfileCard {
  /** CARD_FIELDS keys to display. */
  show: string[]
  /** Free-text tags shown as chips. */
  tags: string[]
}

/**
 * The JSON document stored on IPFS for each profile version. `description`
 * and `identicon` carry the same meaning as in SUBJKT metadata.
 */
export interface ProfileContent {
  schema_version: number
  /** Free-form display name (not unique — the unique name is the handle). */
  name?: string
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
  /** Unique on-chain handle, or null if none is claimed. */
  handle: string | null
  /** Flagged by a moderator: hide from public views. */
  moderated: boolean
  versionCount: number
}

/** A profile record joined with its IPFS document. */
export interface ResolvedProfile extends ChainProfile {
  /** Undefined when the IPFS fetch failed. */
  content?: ProfileContent
}
