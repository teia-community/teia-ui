export const BANNER_URL =
  'https://raw.githubusercontent.com/teia-community/teia-status/main'

export const PATH = {
  FEED: '/',
  ISSUER: '/tz',
  COLLAB: '/kt',
  ABOUT: '/about',
  FAQ: '/faq',
  SYNC: '/sync',
  MINT: '/mint',
  OBJKT: '/objkt',
  TAGS: '/tags',
}

export const MINT_MIN_LIMIT = 1
export const MINT_FILESIZE = 2000

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

export const UKRAINE_FUNDING_CONTRACT = 'KT1DWnLiUkNtAQDErXxudFEH63JC6mqg3HEx'
export const PAKISTAN_FUNDING_CONTRACT = 'KT1Jpf2TAcZS7QfBraQMBeCxjFhH6kAdDL4z'
export const IRAN_FUNDING_CONTRACT = 'KT1KYfj97fpdomqyKsZSBdSVvh9afh93b4Ge'

export const SUPPORTED_MARKETPLACE_CONTRACTS = [
  MARKETPLACE_CONTRACT_V2,
  MARKETPLACE_CONTRACT_TEIA,
]

export const SUBJKT_CONTRACT = 'KT1My1wDZHDGweCrJnQJi3wcFaS67iksirvj'
export const UNREGISTRY_CONTRACT = 'KT18xby6bb1ur1dKe7i6YVrBaksP4AgtuLES'
export const PROXY_FACTORY_CONTRACT = 'KT1DoyD6kr8yLK8mRBFusyKYJUk2ZxNHKP1N'
export const SIGNING_CONTRACT = 'KT1BcLnWRziLDNJNRn3phAANKrEBiXhytsMY'

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

//- Collab

export const CollaboratorType = {
  ADMIN: 'admin',
  CREATOR: 'creator',
  BENEFICIARY: 'benefactor', // Haha - we used the wrong word. Thanks Golan Levin for correcting us ^1x1
  CORE_PARTICIPANT: 'core_participant',
}

export const TabIndex = {
  CREATIONS: 0,
  COLLECTION: 1,
  COLLABS: 2,
}

// TODO - get this manageable on-chain
export const ossProjects = [
  {
    name: 'WG3.2 (collab contract team)',
    address: 'KT1BBYzfuYjgRdeHJ79vG3fZd8cHW9ueCEcN',
  },
  {
    name: 'Processing',
    address: 'tz1aPHze1U5BEEKrGYt3dvY6aAQEeiWm8jjK',
  },
  {
    name: 'three.js',
    address: 'tz1ZUohCAkGjp7vPjQcC4VWcpgYZR1t3Si5C',
  },
  {
    name: 'Teia infrastructure run by TezTools (servers, indexer, maintenance)',
    address: 'tz1Q7fCeswrECCZthfzx2joqkoTdyin8DDg8',
  },
  {
    name: 'Teia Fountain Donations (Multisig)',
    address: 'KT1EsvmkijLKPQmcJMbjDeKRXdwky1LWvwpG',
  },
  {
    name: 'Community Representation/Equity Donations (Multisig)',
    address: 'KT1TGJGjh9oMntcny4J7eVn1NDPgCXimHqss',
  },
  {
    name: 'Ukraine Relief Smart Contract',
    address: 'KT1DWnLiUkNtAQDErXxudFEH63JC6mqg3HEx',
  },
  {
    name: 'Pakistan Relief Smart Contract',
    address: 'KT1Jpf2TAcZS7QfBraQMBeCxjFhH6kAdDL4z',
  },
  {
    name: 'Tezos for Iran',
    address: 'KT1KYfj97fpdomqyKsZSBdSVvh9afh93b4Ge',
  },
]

export const collaboratorTemplate = {
  address: '',
  tezAddress: '',
  shares: undefined,
}

export const tipOptions = [1, 5, 10]

export const mockData = [
  {
    address: 'tz1YJvMiZyXnzvV9pxtAiuCFvaG7XoBZhbUQ',
    shares: 50,
  },
  {
    address: 'tz1LKpeN8ZSSFNyTWiBNaE4u4sjaq7J1Vz2z',
    shares: 50,
  },
  {
    address: 'tz1f94uZ7SF2fLKnMjFzGQTbznd8qpAZ12is',
    shares: 50,
  },
]

export const createProxySchema = `
(map address (pair (bool %isCore) (nat %share))))
`

export const teiaSwapSchema = `
(pair (address %marketplaceAddress)
  (pair %params (address %fa2)
    (pair (nat %objkt_id)
      (pair (nat %objkt_amount)
        (pair (mutez %xtz_per_objkt)
          (pair (nat %royalties) (address %creator)))))))
`

export const teiaCancelSwapSchema = `
(pair (address %marketplaceAddress) (nat %swap_id))
`
