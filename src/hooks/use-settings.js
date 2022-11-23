import useSWR from 'swr'
import axios from 'axios'
import flatten from 'lodash/flatten'

function shuffleLogos(logos) {
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
  const random = function () {
    const x = Math.sin(day++) * 10000
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

function filterWalletBlockList(restrictedLists, permittedLists) {
  const walletAllowList = flatten(permittedLists)

  // Override with permitted list
  const overiddenList = flatten(restrictedLists).filter(
    (account) => !walletAllowList.includes(account)
  )

  return mapFromList(overiddenList)
}

const mapFromList = (input_list) => {
  const out_map = new Map()
  input_list.forEach((element) => {
    out_map.set(element, 1)
  })

  return out_map
}
async function fetchSettings() {
  const [
    objktBlockMapResponse,
    logosResponse,
    logosPrideResponse,
    teiaRestrictedListResponse,
    teiaPermittedListResponse,
    nsfwResponse,
    underReviewResponse,
    ignoreUriResponse,
    feedIgnoreUriResponse,
  ] = await Promise.all([
    axios.get(process.env.REACT_APP_BLOCKLIST_OBJKT), // loads blocked objkt
    axios.get(`${process.env.REACT_APP_LOGOS}/logos.json`), // list of logos we rotate through
    axios.get(`${process.env.REACT_APP_LOGOS}/logos_pride.json`), // list of logos for the pride month
    axios.get(process.env.REACT_APP_TEIA_RESTRICTED_LIST), // Teia list of restricted accounts
    axios.get(process.env.REACT_APP_TEIA_PERMITTED_LIST), // Teia list of acccounts that override HEN's restricted list
    axios.get(process.env.REACT_APP_TEIA_NSFW_LIST), // Teia list of NSFW tokens that are added by the moderation team
    axios.get(process.env.REACT_APP_TEIA_UNDER_REVIEW_LIST), // Teia list of under review accounts added by the moderation team
    axios.get(process.env.REACT_APP_TEIA_IGNORE_URI_LIST), // Teia list of uri to ignore added by the moderation team
    axios.get(process.env.REACT_APP_TEIA_FEED_IGNORE_LIST), // Teia list of wallets to ignore only from feeds (created to avoid fundraiser tag abusers)
  ])

  const logoPacks = [logosResponse, logosPrideResponse]

  const logos = logoPacks.flatMap((logoPack) =>
    logoPack.data.logos.map((logo) => ({
      name: logo,
      themable: logoPack.data.themable,
      collection: logoPack.data.collection,
    }))
  )

  const objktBlockMap = mapFromList(objktBlockMapResponse.data)
  const nsfwMap = mapFromList(nsfwResponse.data)
  const underReviewMap = mapFromList(underReviewResponse.data)
  const ignoreUriMap = mapFromList(ignoreUriResponse.data)
  const feedIgnoreUriMap = mapFromList(feedIgnoreUriResponse.data)

  const walletBlockMap = filterWalletBlockList(
    [teiaRestrictedListResponse.data],
    [teiaPermittedListResponse.data]
  )

  return {
    logos: shuffleLogos(logos),
    walletBlockMap,
    nsfwMap,
    underReviewMap,
    ignoreUriMap,
    objktBlockMap,
    feedIgnoreUriMap,
  }
}

export default function useSettings() {
  const { data, error, isValidating } = useSWR('/settings', fetchSettings, {
    revalidateIfStale: false,
    revalidateOnFocus: false,
  })

  return {
    ...(data ? data : {}),
    error,
    isLoading: isValidating,
  }
}
