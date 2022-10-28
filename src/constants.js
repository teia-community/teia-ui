import _ from 'lodash'

export const BANNER_URL =
  'https://raw.githubusercontent.com/teia-community/teia-status/main'

let LANGUAGE = {}
export const setLanguage = (data) => (LANGUAGE = data)
export const getLanguage = () => LANGUAGE

let objktBlockList = []
export const setObjktBlockList = (data) => (objktBlockList = data)
export const getObjktBlockList = () => objktBlockList

let walletBlockList = []

export const setWalletBlockList = (restrictedLists, permittedLists) => {
  const walletAllowList = _.flatten(permittedLists)

  // Override with permitted list
  walletBlockList = _.flatten(restrictedLists).filter(
    (account) => !walletAllowList.includes(account)
  )
}
export const getWalletBlockList = () => walletBlockList

// TODO: Adapt it for develop's use-setting on merge in develop
let feedBlockList = []

export const setFeedBlockList = (restrictedLists) => {
  feedBlockList = restrictedLists
}
export const getFeedBlockList = () => feedBlockList

let banBlockList = []
export const setBanBlockList = (data) => (banBlockList = data)
export const getBanBlockList = () => banBlockList

let logoList = []
export const setLogoList = (data) => {
  // Shuffles the list daily

  let logos = []

  for (const logo_pack of data) {
    logos = logos.concat(
      logo_pack.logos.map((logo) => {
        return {
          name: logo,
          themable: logo_pack.themable,
          collection: logo_pack.collection,
        }
      })
    )
  }

  let currentIndex = logos.length,
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
    temporaryValue = logos[currentIndex]
    logos[currentIndex] = logos[randomIndex]
    logos[randomIndex] = temporaryValue
  }

  logoList = logos
}
export const getLogoList = () => logoList

let nsfwList = []
export const setNsfwList = (data) => (nsfwList = data)
export const getNsfwList = () => nsfwList

let underReviewList = []
export const setUnderReviewList = (data) => (underReviewList = data)
export const getUnderReviewList = () => underReviewList

let ignoreUriList = []
export const setIgnoreUriList = (data) => (ignoreUriList = data)
export const getIgnoreUriList = () => ignoreUriList

export const PATH = {
  FEED: '/',
  ISSUER: '/tz',
  COLLAB: '/kt',
  ABOUT: '/about',
  FAQ: '/faq',
  SYNC: '/sync',
  MINT: '/mint',
  OBJKT: '/objkt',
  GALLERY: '/gallery',
  TAGS: '/tags',
}

export const MINT_MIN_LIMIT = 1
export const MINT_MAX_LIMIT = 10000
export const MINT_FILESIZE = 100

export const MIMETYPE = {
  BMP: 'image/bmp',
  FLAC: 'audio/flac',
  GIF: 'image/gif',
  GLB: 'model/gltf-binary',
  GLTF: 'model/gltf+json',
  DIRECTORY: 'application/x-directory',
  JPEG: 'image/jpeg',
  MD: 'text/markdown',
  MP3: 'audio/mpeg',
  MP4: 'video/mp4',
  OGA: 'audio/ogg',
  OGV: 'video/ogg',
  PDF: 'application/pdf',
  PNG: 'image/png',
  QUICKTIME: 'video/quicktime',
  SVG: 'image/svg+xml',
  TIFF: 'image/tiff',
  WAV: 'audio/wav',
  WEBM: 'video/webm',
  WEBP: 'image/webp',
  XWAV: 'audio/x-wav',
  ZIP: 'application/zip',
  ZIP1: 'application/x-zip-compressed',
  ZIP2: 'multipart/x-zip',
}

export const ALLOWED_MIMETYPES = Object.keys(MIMETYPE)
  .map((k) => MIMETYPE[k])
  .filter((e) => e !== MIMETYPE.GLTF) // disabling GLTF from new updates

export const ALLOWED_FILETYPES_LABEL = Object.entries(MIMETYPE)
  .filter((e) => ALLOWED_MIMETYPES.includes(e[1]))
  .filter(
    (e) =>
      ![
        'ZIP1',
        'ZIP2',
        'OGA',
        'OGV',
        'BMP',
        'TIFF',
        'XWAV',
        'QUICKTIME',
        'WEBP',
      ].includes(e[0])
  )
  .map((e) => (e[0] === 'ZIP' ? 'HTML (ZIP ARCHIVE)' : e[0]))
  .join(', ')

export const ALLOWED_COVER_MIMETYPES = [
  MIMETYPE.JPEG,
  MIMETYPE.PNG,
  MIMETYPE.GIF,
  MIMETYPE.MP4,
]

export const ALLOWED_COVER_FILETYPES_LABEL = ['jpeg, png, gif']

export const MAX_EDITIONS = 10000 // Limited by contract

export const MIN_ROYALTIES = 10 // Limited by contract

export const MAX_ROYALTIES = 25 // Limited by contract

export const IPFS_DEFAULT_THUMBNAIL_URI =
  'ipfs://QmNrhZHUaEqxhyLfqoq1mtHSipkWHeT31LNHb1QEbDHgnc'

export const MARKETPLACE_CONTRACT_V1 = 'KT1Hkg5qeNhfwpKW4fXvq7HGZB9z2EnmCCA9'
export const MARKETPLACE_CONTRACT_V2 = 'KT1HbQepzV1nVGg8QVznG7z4RcHseD5kwqBn'
export const MARKETPLACE_CONTRACT_TEIA = 'KT1PHubm9HtyQEJ4BBpMTVomq6mhbfNZ9z5w'

export const MARKETPLACE_CONTRACT_OBJKTCOM_V1 =
  'KT1FvqJwEDWb1Gwc55Jd1jjTHRVWbYKUUpyq'
export const MARKETPLACE_CONTRACT_OBJKTCOM_V4 =
  'KT1WvzYHCNBvDSdwafTHv7nJ1dWmZ8GCYuuC'

export const HEN_CONTRACT_FA2 = 'KT1RJ6PbjHpwc3M5rw5s2Nbmefwbuwbdxton'

export const SUPPORTED_MARKETPLACE_CONTRACTS = [
  MARKETPLACE_CONTRACT_V2,
  MARKETPLACE_CONTRACT_TEIA,
]

export const SWAP_TYPE_TEIA = 'TEIA'
export const SWAP_TYPE_HEN = 'HEN'

export const MAIN_MARKETPLACE_CONTRACT = MARKETPLACE_CONTRACT_TEIA // the one that is used for swapping
export const MAIN_MARKETPLACE_CONTRACT_SWAP_TYPE = SWAP_TYPE_TEIA

export const BURN_ADDRESS = 'tz1burnburnburnburnburnburnburjAYjjX'

export const COVER_COMPRESSOR_OPTIONS = {
  quality: 0.85,
  maxWidth: 1024,
  maxHeight: 1024,
}

export const THUMBNAIL_COMPRESSOR_OPTIONS = {
  quality: 0.85,
  maxWidth: 350,
  maxHeight: 350,
}

export const LICENSE_TYPES = {
  none: 'None (All rights reserved)',
  'cc-by-4.0': 'CC-BY-4.0 (Attribution)',
  'cc-by-sa-4.0': 'CC BY-SA 4.0 (Attribution ShareAlike)',
  'cc-by-nd-4.0': 'CC BY-ND 4.0 (Attribution-NoDerivs)',
  'cc-by-nc-4.0': 'CC BY-NC 4.0 (Attribution-NonCommercial)',
  'cc-by-nc-sa-4.0': 'CC BY-NC-SA 4.0 (Attribution-NonCommercial-ShareAlike)',
  'cc-by-nc-nd-4.0': 'CC BY-NC-ND 4.0 (Attribution-NonCommercial-NoDerivs)',
  custom: 'Custom (Specify below)',
}

export const LICENSE_TYPES_OPTIONS = Object.keys(LICENSE_TYPES).map((k) => {
  return {
    label: LICENSE_TYPES[k],
    value: k,
  }
})

export const LANGUAGES = {
  none: 'None',
  af: 'Afrikaans (Afrikaans)',
  sq: 'Albanian (shqipe)',
  gsw: 'Alsatian (Elsässisch)',
  am: 'Amharic (አማርኛ)',
  ar: 'Arabic (العربية)',
  hy: 'Armenian (Հայերեն)',
  as: 'Assamese (অসমীয়া)',
  az: 'Azeri (Azərbaycan­ılı)',
  ba: 'Bashkir (Башҡорт)',
  eu: 'Basque (euskara)',
  be: 'Belarusian (беларуская)',
  bn: 'Bengali (বাংলা)',
  bs: 'Bosnian (bosanski)/босански',
  br: 'Breton (brezhoneg)',
  bg: 'Bulgarian (български)',
  my: 'Burmese (Myanmar)',
  ca: 'Catalan (català)',
  zh: 'Chinese (中文)',
  co: 'Corsican (Corsu)',
  hr: 'Croatian (hrvatski)',
  cs: 'Czech (čeština)',
  da: 'Danish (dansk)',
  prs: 'Dari (درى)',
  dv: 'Divehi (ދިވެހިބަސް)',
  nl: 'Dutch (Nederlands)',
  en: 'English (English)',
  et: 'Estonian (eesti)',
  fo: 'Faroese (føroyskt)',
  fil: 'Filipino (Filipino)',
  fi: 'Finnish (suomi)',
  fr: 'French (français)',
  fy: 'Frisian (Frysk)',
  gl: 'Galician (galego)',
  ka: 'Georgian (ქართული)',
  de: 'German (Deutsch)',
  el: 'Greek (ελληνικά)',
  kl: 'Greenlandic (kalaallisut)',
  gu: 'Gujarati (ગુજરાતી)',
  ha: 'Hausa (Hausa)',
  he: 'Hebrew (עברית)',
  hi: 'Hindi (हिंदी)',
  hu: 'Hungarian (magyar)',
  is: 'Icelandic (íslenska)',
  ig: 'Igbo (Igbo)',
  id: 'Indonesian (Bahasa Indonesia)',
  iu: 'Inuktitut (Inuktitut /ᐃᓄᒃᑎᑐᑦ (ᑲᓇᑕ))',
  ga: 'Irish (Gaeilge)',
  it: 'Italian (italiano)',
  ja: 'Japanese (日本語)',
  quc: "K'iche (K'iche)",
  kn: 'Kannada (ಕನ್ನಡ)',
  kk: 'Kazakh (Қазащb)',
  km: 'Khmer (ខ្មែរ)',
  rw: 'Kinyarwanda (Kinyarwanda)',
  sw: 'Kiswahili (Kiswahili)',
  kok: 'Konkani (कोंकणी)',
  ko: 'Korean (한국어)',
  ky: 'Kyrgyz (Кыргыз)',
  lo: 'Lao (ລາວ)',
  lv: 'Latvian (latviešu)',
  lt: 'Lithuanian (lietuvių)',
  dsb: 'Lower Sorbian (dolnoserbšćina)',
  lb: 'Luxembourgish (Lëtzebuergesch)',
  mk: 'Macedonian (македонски јазик)',
  ms: 'Malay (Bahasa Malaysia)',
  ml: 'Malayalam (മലയാളം)',
  mt: 'Maltese (Malti)',
  mi: 'Maori (Reo Māori)',
  arn: 'Mapudungun (Mapudungun)',
  mr: 'Marathi (मराठी)',
  moh: "Mohawk (Kanien'kéha)",
  mn: 'Mongolian (Монгол хэл/ᠮᠤᠨᠭᠭᠤᠯ ᠬᠡᠯᠡ)',
  ne: 'Nepali (नेपाली (नेपाल))',
  nb: "Norwegian 'Bokmål' (norsk 'bokmål')",
  no: 'Norwegian (norsk)',
  nn: 'Norwegian Nynorsk (norsk (nynorsk))',
  oc: 'Occitan (Occitan)',
  or: 'Oriya (ଓଡ଼ିଆ)',
  ps: 'Pashto (پښتو)',
  fa: 'Persian (فارسى)',
  pl: 'Polish (polski)',
  pt: 'Portuguese (Português)',
  pa: 'Punjabi (ਪੰਜਾਬੀ)',
  quz: 'Quechua (runasimi)',
  ro: 'Romanian (română)',
  rm: 'Romansh (Rumantsch)',
  ru: 'Russian (русский)',
  smn: 'Sami Inari (sämikielâ)',
  smj: 'Sami Lule (julevusámegiella)',
  se: 'Sami Northern (davvisámegiella)',
  sms: 'Sami Skolt (sääm´ǩiõll)',
  sma: 'Sami Southern (åarjelsaemiengiel)e',
  sa: 'Sanskrit (संस्कृत)',
  gd: 'Scottish Gaelic (Gàidhlig)',
  sr: 'Serbian (srpski/српски)',
  nso: 'Sesotho (Sesotho sa Leboa)',
  tn: 'Setswana (Setswana)',
  si: 'Sinhala (සිංහ)',
  sk: 'Slovak (slovenčina)',
  sl: 'Slovenian (slovenski)',
  es: 'Spanish (español)',
  sv: 'Swedish (svenska)',
  syr: 'Syriac (ܣܘܪܝܝܐ)',
  tg: 'Tajik (Тоҷикӣ)',
  tzm: 'Tamazight (Tamazight)',
  ta: 'Tamil (தமிழ்)',
  tt: 'Tatar (Татар)',
  te: 'Telugu (తెలుగు)',
  th: 'Thai (ไทย)',
  bo: 'Tibetan (བོད་ཡིག)',
  tr: 'Turkish (Türkçe)',
  tk: 'Turkmen (türkmençe)',
  uk: 'Ukrainian (українська)',
  hsb: 'Upper (Sorbian) hornjoserbšćina',
  ur: 'Urdu (اُردو)',
  ug: 'Uyghur (ئۇيغۇرچە)',
  uz: "Uzbek (U'zbek/Ўзбек)",
  vi: 'Vietnamese (Tiếng Việt)',
  cy: 'Welsh (Cymraeg)',
  wo: 'Wolof (Wolof)',
  sah: 'Yakut (саха)',
  ii: 'Yi (ꆈꌠꁱꂷ)',
  yo: 'Yoruba (Yoruba)',
  xh: 'isiXhosa (isiXhosa)',
  zu: 'isiZulu (isiZulu)',
}

export const LANGUAGES_OPTIONS = Object.keys(LANGUAGES).map((k) => {
  return {
    label: LANGUAGES[k],
    value: k,
  }
})

export const METADATA_CONTENT_RATING_MATURE = 'mature'
