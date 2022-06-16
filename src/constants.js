import _ from 'lodash'

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

let banBlockList = []
export const setBanBlockList = (data) => (banBlockList = data)
export const getBanBlockList = () => banBlockList

let logoList = []
export const setLogoList = (data) => {
  // Shuffles the list daily
  let logos = data.logos
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
  GIF: 'image/gif',
  JPEG: 'image/jpeg',
  PNG: 'image/png',
  SVG: 'image/svg+xml',
  TIFF: 'image/tiff',
  WEBP: 'image/webp',
  MP4: 'video/mp4',
  OGV: 'video/ogg',
  QUICKTIME: 'video/quicktime',
  WEBM: 'video/webm',
  GLB: 'model/gltf-binary',
  GLTF: 'model/gltf+json',
  MP3: 'audio/mpeg',
  OGA: 'audio/ogg',
  WAV: 'audio/wav',
  XWAV: 'audio/x-wav',
  FLAC: 'audio/flac',
  PDF: 'application/pdf',
  ZIP: 'application/zip',
  ZIP1: 'application/x-zip-compressed',
  ZIP2: 'multipart/x-zip',
  MD: 'text/markdown',
}

export const IPFS_DIRECTORY_MIMETYPE = 'application/x-directory'

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
  none: 'None',
  'cc-by-4.0': 'CC-BY-4.0 (Attribution)',
  'cc-by-sa-4.0': 'CC BY-SA 4.0 (Attribution ShareAlike)',
  'cc-by-nd-4.0': 'CC BY-ND 4.0 (Attribution-NoDerivs)',
  'cc-by-nc-4.0': 'CC BY-NC 4.0 (Attribution-NonCommercial)',
  'cc-by-nc-sa-4.0': 'CC BY-NC-SA 4.0 (Attribution-NonCommercial-ShareAlike)',
  'cc-by-nc-nd-4.0': 'CC BY-NC-ND 4.0 (Attribution-NonCommercial-NoDerivs)',
  custom: 'Custom (Specify)',
}

export const LANGUAGES = {
  none: 'None',
  af: 'Afrikaans	(Afrikaans)',
  am: 'Amharic	(አማርኛ)',
  ar: 'Arabic	(العربية)',
  arn: 'Mapudungun	(Mapudungun)',
  as: 'Assamese	(অসমীয়া)',
  az: 'Azeri	(Azərbaycan­ılı)',
  ba: 'Bashkir	(Башҡорт)',
  be: 'Belarusian (беларуская)',
  bg: 'Bulgarian (български)',
  bn: 'Bengali (বাংলা)',
  bo: 'Tibetan	(བོད་ཡིག)',
  br: 'Breton	(brezhoneg)',
  bs: 'Bosnian	(bosanski)/босански',
  ca: 'Catalan	(català)',
  co: 'Corsican	(Corsu)',
  cs: 'Czech	(čeština)',
  cy: 'Welsh	(Cymraeg)',
  da: 'Danish	(dansk)',
  de: 'German	(Deutsch)',
  dsb: 'Lower Sorbian	(dolnoserbšćina)',
  dv: 'Divehi	(ދިވެހިބަސް)',
  el: 'Greek	(ελληνικά)',
  en: 'English	(English)',
  es: 'Spanish	(español)',
  et: 'Estonian	(eesti)',
  eu: 'Basque	(euskara)',
  fa: 'Persian	(فارسى)',
  fi: 'Finnish	(suomi)',
  fil: 'Filipino	(Filipino)',
  fo: 'Faroese	(føroyskt)',
  fr: 'French	(français)',
  fy: 'Frisian	(Frysk)',
  ga: 'Irish	(Gaeilge)',
  gd: 'Scottish Gaelic (Gàidhlig)',
  gl: 'Galician	(galego)',
  gsw: 'Alsatian	(Elsässisch)',
  gu: 'Gujarati	(ગુજરાતી)',
  ha: 'Hausa	(Hausa)',
  he: 'Hebrew	(עברית)',
  hi: 'Hindi	(हिंदी)',
  hr: 'Croatian	(hrvatski)',
  hsb: 'Upper (Sorbian)	hornjoserbšćina',
  hu: 'Hungarian	(magyar)',
  hy: 'Armenian	(Հայերեն)',
  id: 'Indonesian	(Bahasa Indonesia)',
  ig: 'Igbo	(Igbo)',
  ii: 'Yi	(ꆈꌠꁱꂷ)',
  is: 'Icelandic	(íslenska)',
  it: 'Italian	(italiano)',
  iu: 'Inuktitut	(Inuktitut /ᐃᓄᒃᑎᑐᑦ (ᑲᓇᑕ))',
  ja: 'Japanese	(日本語)',
  ka: 'Georgian	(ქართული)',
  kk: 'Kazakh	(Қазащb)',
  kl: 'Greenlandic	(kalaallisut)',
  km: 'Khmer	(ខ្មែរ)',
  kn: 'Kannada	(ಕನ್ನಡ)',
  ko: 'Korean	(한국어)',
  kok: 'Konkani	(कोंकणी)',
  ky: 'Kyrgyz	(Кыргыз)',
  lb: 'Luxembourgish (Lëtzebuergesch)',
  lo: 'Lao	(ລາວ)',
  lt: 'Lithuanian	(lietuvių)',
  lv: 'Latvian	(latviešu)',
  mi: 'Maori	(Reo Māori)',
  mk: 'Macedonian	(македонски јазик)',
  ml: 'Malayalam	(മലയാളം)',
  mn: 'Mongolian	(Монгол хэл/ᠮᠤᠨᠭᠭᠤᠯ ᠬᠡᠯᠡ)',
  moh: "Mohawk	(Kanien'kéha)",
  mr: 'Marathi	(मराठी)',
  ms: 'Malay	(Bahasa Malaysia)',
  mt: 'Maltese	(Malti)',
  my: 'Burmese	(Myanmar)',
  nb: "Norwegian 'Bokmål'	(norsk 'bokmål')",
  ne: 'Nepali	(नेपाली (नेपाल))',
  nl: 'Dutch	(Nederlands)',
  nn: 'Norwegian Nynorsk	(norsk (nynorsk))',
  no: 'Norwegian (norsk)',
  nso: 'Sesotho	(Sesotho sa Leboa)',
  oc: 'Occitan	(Occitan)',
  or: 'Oriya	(ଓଡ଼ିଆ)',
  pa: 'Punjabi	(ਪੰਜਾਬੀ)',
  pl: 'Polish	(polski)',
  prs: 'Dari	(درى)',
  ps: 'Pashto	(پښتو)',
  pt: 'Portuguese	(Português)',
  quc: "K'iche (K'iche)",
  quz: 'Quechua	(runasimi)',
  rm: 'Romansh	(Rumantsch)',
  ro: 'Romanian	(română)',
  ru: 'Russian	(русский)',
  rw: 'Kinyarwanda	(Kinyarwanda)',
  sa: 'Sanskrit	(संस्कृत)',
  sah: 'Yakut	(саха)',
  se: 'Sami Northern	(davvisámegiella)',
  si: 'Sinhala	(සිංහ)',
  sk: 'Slovak	(slovenčina)',
  sl: 'Slovenian	(slovenski)',
  sma: 'Sami Southern	(åarjelsaemiengiel)e',
  smj: 'Sami Lule	(julevusámegiella)',
  smn: 'Sami Inari	(sämikielâ)',
  sms: 'Sami Skolt	(sääm´ǩiõll)',
  sq: 'Albanian	(shqipe)',
  sr: 'Serbian	(srpski/српски)',
  sv: 'Swedish	(svenska)',
  sw: 'Kiswahili	(Kiswahili)',
  syr: 'Syriac	(ܣܘܪܝܝܐ)',
  ta: 'Tamil	(தமிழ்)',
  te: 'Telugu	(తెలుగు)',
  tg: 'Tajik	(Тоҷикӣ)',
  th: 'Thai	(ไทย)',
  tk: 'Turkmen	(türkmençe)',
  tn: 'Setswana	(Setswana)',
  tr: 'Turkish	(Türkçe)',
  tt: 'Tatar	(Татар)',
  tzm: 'Tamazight	(Tamazight)',
  ug: 'Uyghur	(ئۇيغۇرچە)',
  uk: 'Ukrainian	(українська)',
  ur: 'Urdu	(اُردو)',
  uz: "Uzbek	(U'zbek/Ўзбек)",
  vi: 'Vietnamese	(Tiếng Việt)',
  wo: 'Wolof	(Wolof)',
  xh: 'isiXhosa	(isiXhosa)',
  yo: 'Yoruba	(Yoruba)',
  zh: 'Chinese	(中文)',
  zu: 'isiZulu	(isiZulu)',
}
