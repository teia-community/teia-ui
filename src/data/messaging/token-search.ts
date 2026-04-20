import { HEN_CONTRACT_FA2 } from '@constants'

export interface NormalizedTokenEmbed {
  type: 'token'
  fa2: string
  tokenId: string
  name: string
  artist: string
  artistName: string
  mimeType: string
  displayUri: string
  artifactUri: string
  thumbnailUri: string
}

/**
 * Convert Teia GraphQL token object into NormalizedTokenEmbed.
 */
export function tokenToEmbed(token: {
  token_id: string
  fa2_address?: string
  name?: string
  artist_address?: string
  artist_profile?: { name?: string }
  mime_type?: string
  display_uri?: string
  artifact_uri?: string
  thumbnail_uri?: string
}): NormalizedTokenEmbed {
  return {
    type: 'token',
    fa2: token.fa2_address || HEN_CONTRACT_FA2,
    tokenId: token.token_id,
    name: token.name || `#${token.token_id}`,
    artist: token.artist_address || '',
    artistName: token.artist_profile?.name || '',
    mimeType: token.mime_type || '',
    displayUri: token.display_uri || '',
    artifactUri: token.artifact_uri || '',
    thumbnailUri: token.thumbnail_uri || '',
  }
}
