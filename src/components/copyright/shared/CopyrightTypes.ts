export interface CopyrightClauses {
  reproduce: boolean
  broadcast: boolean
  publicDisplay: boolean
  createDerivativeWorks: boolean
  exclusiveRights: string
  retainCreatorRights: boolean
  releasePublicDomain: boolean
  requireAttribution: boolean
  rightsAreTransferable: boolean
  expirationDate: string | null
  expirationDateExists: boolean
  customUriEnabled: boolean
  customUri: string | null
  addendum: string | null
  firstParagraph: string
}

export interface CopyrightEntry {
  id: number
  active: boolean
  key: { address: string; nat: string }
  value: {
    active: boolean
    clauses: CopyrightClauses
    creators: string[]
    parent_registery: number | null
    related_tezos_nfts: Array<{ contract: string; token_id: string }>
    related_external_nfts: string[]
  }
  firstLevel: number
  lastLevel: number
}

export interface NFTMetadata {
  name?: string
  description?: string
  thumbnailUri?: string
  displayUri?: string
  artifactUri?: string
}
