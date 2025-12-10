import useSWR from 'swr'
import flatten from 'lodash/flatten'

export type ListMap = Map<string, number>
export type SettingsData = {
  logos: { name: string; themable: boolean; collection: string }[]
  walletBlockMap: ListMap
  nsfwMap: ListMap
  underReviewMap: ListMap
  ignoreUriMap: ListMap
  feedIgnoreUriMap: ListMap
  photosensitiveMap: ListMap
  objktBlockMap: ListMap
}

export type UseSettingsResult = SettingsData & {
  error?: Error
  isLoading: boolean
}

function shuffleLogos(logos: { name: string; themable: boolean; collection: string }[]) {
  // Shuffles the list daily
  const shuffledLogos = [...logos]
  let currentIndex = shuffledLogos.length
  let temporaryValue
  let randomIndex
  const date = new Date(Date.now())
  let day =
    (Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) -
      Date.UTC(date.getFullYear(), 0, 0)) /
    24 /
    60 /
    60 /
    1000
  const random = () => {
    const x = Math.sin(day++) * 1e4
    return x - Math.floor(x)
  }

  while (0 !== currentIndex) {
    randomIndex = Math.floor(random() * currentIndex)
    currentIndex--
    //swap
    temporaryValue = shuffledLogos[currentIndex]
    shuffledLogos[currentIndex] = shuffledLogos[randomIndex]
    shuffledLogos[randomIndex] = temporaryValue
  }

  return shuffledLogos
}

function filterWalletBlockList(restrictedLists: string[][], permittedLists: string[][]) {
  const walletAllowList = flatten(permittedLists)

  // Override with permitted list
  const overiddenList = flatten(restrictedLists).filter(
    (account) => !walletAllowList.includes(account)
  )

  return mapFromList(overiddenList)
}

const mapFromList = (input_list: string[]) => {
  const out_map = new Map<string, number>()
  input_list.forEach((element) => {
    out_map.set(element, 1)
  })

  return out_map
}

const report_url = (name: string) => `${import.meta.env.VITE_TEIA_REPORT}/${name}`

const fetchJSON = async (url: string) => {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}`)
  }
  return response.json()
}

/**
 * Fetches the various lists cached with SWR
 */
async function fetchSettings(): Promise<SettingsData> {
  const [
    objktBlockMapResponse,
    logosResponse,
    logosPrideResponse,
    teiaRestrictedListResponse,
    teiaPermittedListResponse,
    nsfwResponse,
    photosensitiveResponse,
    underReviewResponse,
    ignoreUriResponse,
    feedIgnoreUriResponse,
  ] = await Promise.all([
    fetchJSON(report_url('restricted_objkt.json')), // loads blocked objkt
    fetchJSON(`${import.meta.env.VITE_LOGOS}/logos.json`), // list of logos we rotate through
    fetchJSON(`${import.meta.env.VITE_LOGOS}/logos_pride.json`), // list of logos for the pride month
    fetchJSON(report_url('restricted.json')), // Teia list of restricted accounts
    fetchJSON(report_url('permitted.json')), // Teia list of accounts that override HEN's restricted list
    fetchJSON(report_url('nsfw.json')), // Teia list of NSFW tokens that are added by the moderation team
    fetchJSON(report_url('photosensitive.json')), // Teia list of Photosensitive tokens that are added by the moderation team
    fetchJSON(report_url('under_review.json')), // Teia list of under review accounts added by the moderation team
    fetchJSON(report_url('ignore_uri.json')), // Teia list of uri to ignore added by the moderation team
    fetchJSON(report_url('fund_feed_ignored_addresses.json')), // Teia list of wallets to ignore only from feeds (created to avoid fundraiser tag abusers)
  ])

  const logoPacks = [logosResponse, logosPrideResponse]

  const logos = logoPacks.flatMap((logoPack) =>
    logoPack.logos.map((logo: string) => ({
      name: logo,
      themable: logoPack.themable,
      collection: logoPack.collection,
    }))
  )

  const objktBlockMap = mapFromList(
    objktBlockMapResponse.map((n: string | number) => n.toString())
  )
  const nsfwMap = mapFromList(nsfwResponse.map((n: string | number) => n.toString()))
  const photosensitiveMap = mapFromList(
    photosensitiveResponse.map((n: string | number) => n.toString())
  )
  const underReviewMap = mapFromList(underReviewResponse)
  const ignoreUriMap = mapFromList(ignoreUriResponse)
  const feedIgnoreUriMap = mapFromList(feedIgnoreUriResponse)

  const walletBlockMap = filterWalletBlockList(
    [teiaRestrictedListResponse],
    [teiaPermittedListResponse]
  )
  return {
    logos: shuffleLogos(logos),
    walletBlockMap,
    nsfwMap,
    photosensitiveMap,
    underReviewMap,
    ignoreUriMap,
    objktBlockMap,
    feedIgnoreUriMap,
  }
}

/**
 * Hook to manage shared data (allow/deny lists & logos)
 */
export default function useSettings(): UseSettingsResult {
  const { data, error, isValidating } = useSWR('/settings', fetchSettings, {
    revalidateIfStale: false,
    revalidateOnFocus: false,
  })

  return {
    ...(data || {
      logos: [],
      walletBlockMap: new Map(),
      nsfwMap: new Map(),
      underReviewMap: new Map(),
      ignoreUriMap: new Map(),
      feedIgnoreUriMap: new Map(),
      photosensitiveMap: new Map(),
      objktBlockMap: new Map(),
    }),
    error,
    isLoading: isValidating,
  }
}
