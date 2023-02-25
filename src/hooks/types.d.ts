type ListMap = Map<string, number>

export interface SettingsData {
  logos: string[]
  walletBlockMap: ListMap
  nsfwMap: ListMap
  underReviewMap: ListMap
  ignoreUriMap: ListMap
  objktBlockMap: ListMap
  feedIgnoreUriMap: ListMap
  photosensitiveMap: ListMap
}

export interface SettingsResponse {
  data: SettingsData
  error: Error
  isLoading: boolean
}
