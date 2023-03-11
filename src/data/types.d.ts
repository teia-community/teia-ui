// `DATA` TYPES

// API
interface TzpMetadata {
  alias?: string
  tzprofile?: string
  twitter?: string
  discord?: string
  github?: string
  dns?: string
}

interface TzktMetadata {
  twitter?: string
  alias?: string
}

interface TzktData {
  data?: TzktMetadata
}

// IPFS
interface PrepareProps {
  name: string
  description: string
  tags: string
  address: string
  file: FileForm
  cover: FileForm
  thumbnail: FileForm
  rights: string
  rightUri?: string
  language?: string
  accessibility: string
  contentRating: string
  formats: any
}

interface PrepareDirectoryOptions {
  name?: string
  description?: string
  tags?: string
  address: string
  files: FileMint[]
  cover: FileForm
  thumbnail: FileForm
  formats: MintFormat[]
  generateDisplayUri: string
  rights?: string
  rightUri?: string
  language?: string
  accessibility?: string
  contentRating?: string
}
interface BuildMetadataOptions {
  name?: string
  description?: string
  tags?: string
  uri: string
  address: string
  displayUri: string
  thumbnailUri: string
  formats: MintFormat[]
  rights?: string
  rightUri?: string
  language?: string
  accessibility?: string
  contentRating?: string
}
interface TeiaMetadata {
  name: string
  description: string
  tags: string[]
  symbol: string
  artifactUri: string
  displayUri: string
  thumbnailUri: string
  creators: string[]
  formats: MintFormat[]
  decimals: number
  isBooleanAmount: boolean
  shouldPreferSymbol: boolean
  rights: string
  date: string
  mintingTool: string
  //optional
  accessibility?: string
  contentRating?: string
  rightUri?: string
  language?: string
}
