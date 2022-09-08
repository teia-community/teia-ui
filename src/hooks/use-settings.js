import useSWR from 'swr'
import axios from 'axios'
import flatten from 'lodash/flatten'

function shuffleLogos(logos) {
  // Shuffles the list daily
  let shuffledLogos = [...logos]
  let currentIndex = shuffledLogos.length,
    temporaryValue,
    randomIndex
  const date = new Date(Date.now())
  let day =
    (Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) -
      Date.UTC(date.getFullYear(), 0, 0)) /
    24 /
    60 /
    60 /
    1000
  let random = function () {
    var x = Math.sin(day++) * 10000
    return x - Math.floor(x)
  }

  while (0 !== currentIndex) {
    randomIndex = Math.floor(random() * currentIndex)
    currentIndex -= 1
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
  const walletBlockList = new Map()
  overiddenList.forEach((e) => {
    walletBlockList.set(e, 1)
  })
  return walletBlockList
}

async function fetchSettings() {
  const [
    objktBlockListResponse,
    banBlockListResponse,
    logosResponse,
    logosPrideResponse,
    teiaRestrictedListResponse,
    teiaPermittedListResponse,
  ] = await Promise.all([
    axios.get(process.env.REACT_APP_BLOCKLIST_OBJKT), // loads blocked objkt
    axios.get(process.env.REACT_APP_BLOCKLIST_BAN), // blocked wallets (dont allow to visualise in /tz/walletid)
    axios.get(`${process.env.REACT_APP_LOGOS}/logos.json`), // list of logos we rotate through
    axios.get(`${process.env.REACT_APP_LOGOS}/logos_pride.json`), // list of logos for the pride month
    axios.get(process.env.REACT_APP_TEIA_RESTRICTED_LIST), // Teia list of restricted accounts
    axios.get(process.env.REACT_APP_TEIA_PERMITTED_LIST), // Teia list of acccounts that override HEN's restricted list
  ])

  const logoPacks = [logosResponse, logosPrideResponse]

  const logos = logoPacks.flatMap((logoPack) =>
    logoPack.data.logos.map((logo) => ({
      name: logo,
      themable: logoPack.data.themable,
      collection: logoPack.data.collection,
    }))
  )

  const objktBlockList = new Map()
  objktBlockListResponse.data.forEach((element) => {
    objktBlockList.set(element, 1)
  })

  const banBlockList = new Map()
  banBlockListResponse.data.forEach((e) => {
    banBlockList.set(e, 1)
  })

  return {
    objktBlockList,
    banBlockList,
    logos: shuffleLogos(logos),
    walletBlockList: filterWalletBlockList(
      [teiaRestrictedListResponse.data],
      [teiaPermittedListResponse.data]
    ),
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
