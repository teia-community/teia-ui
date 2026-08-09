// Curations contract types.

export interface CurationToken {
  fa2_address: string
  token_id: string
  fee_mutez?: number
}

export type CurationLayout = 'masonry' | 'list'

export interface CurationFeeConfig {
  mode: 'global' | 'per_token'
  global_mutez: number
}

export interface CurationContent {
  schema_version: number
  title: string
  description: string
  cover_image?: string
  display: { layout: CurationLayout }
  tokens: CurationToken[]
  curations: number[]
  fee: CurationFeeConfig
  owner: string
  editor: string
  timestamp: string
}

export interface Curation {
  id: number
  owner: string
  cid: string
  hidden: boolean
  versionCount: number
}

export interface CurationUserRoles {
  isModerator: boolean
  isMultisig: boolean
  canModerate: boolean
  canCreate: boolean
}
