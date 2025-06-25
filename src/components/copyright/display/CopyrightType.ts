export type ClauseRecord = {
    reproduce: boolean
    broadcast: boolean
    publicDisplay: boolean
    createDerivativeWorks: boolean
    exclusiveRights: string
    retainCreatorRights: boolean
    releasePublicDomain: boolean
    requireAttribution: boolean
    rightsAreTransferable: boolean
    expirationDate: string
    expirationDateExists: boolean
    customUriEnabled: boolean
    customUri: string
    addendum: string
    firstParagraph: string
  }
  
  export type TokenInfo = {
    tokenId: string
    contractAddress: string
  }
  
  export type Metadata = {
    name: string
    description: string
    thumbnailUri: string
  }
  
  export type CopyrightData = {
    metadata: Metadata
    clauses: ClauseRecord
    token: TokenInfo
  }
  