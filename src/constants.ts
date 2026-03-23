import { flipObject } from './utils'

export const BANNER_URL = 'https://lists.teia.art/teia-status'

export const PATH = {
  FEED: '/',
  ISSUER: '/tz',
  COLLAB: '/kt',
  ABOUT: '/about',
  FAQ: '/faq',
  CLAIM: '/claim',
  DAO: '/dao',
  COPYRIGHT: '/copyright',
  PROPOSAL: '/proposal',
  POLLS: '/polls',
  POLL: '/poll',
  SYNC: '/sync',
  MINT: '/mint',
  OBJKT: '/objkt',
  TAGS: '/tags',
}

export const MINT_MIN_LIMIT = 1
export const MINT_FILESIZE = 2000

export const MIMETYPE: { [key: string]: string } = {
  BMP: 'image/bmp',
  FLAC: 'audio/flac',
  GIF: 'image/gif',
  GLB: 'model/gltf-binary',
  GLTF: 'model/gltf+json',
  DIRECTORY: 'application/x-directory',
  JPEG: 'image/jpeg',
  MD: 'text/markdown',
  MIDI: 'audio/midi',
  MID: 'audio/mid',
  MP3: 'audio/mpeg',
  MP4: 'video/mp4',
  OGG: 'audio/ogg',
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
  TXT: 'text/plain',
}

export const AUDIO_MIME_TYPES = [
  'audio/mpeg',
  'audio/wav',
  'audio/flac',
  'audio/x-flac',
  'audio/ogg',
]

export const ALLOWED_MIMETYPES = Object.keys(MIMETYPE)
  .map((k) => MIMETYPE[k])
  // disabling GLTF from new updates,
  // disabling TXT upload since they will be done via the textarea input
  .filter((e) => e !== MIMETYPE.GLTF || e !== MIMETYPE.TXT)

export const ALLOWED_FILETYPES_LABEL = Object.entries(MIMETYPE)
  .filter((e) => ALLOWED_MIMETYPES.includes(e[1]))
  .filter(
    (e) =>
      ![
        'ZIP1',
        'ZIP2',
        'OGV',
        'BMP',
        'TIFF',
        'XWAV',
        'QUICKTIME',
        'WEBP',
        'TXT',
      ].includes(e[0])
  )
  .map((e) => (e[0] === 'ZIP' ? 'HTML (ZIP ARCHIVE)' : e[0]))
  .join(', ')

export const FEED_LIST = [
  'Recent Sales',
  'Random',
  'New OBJKTs',
  'Friends',
  'Quake Aid',
  '🇵🇸 Tez4Pal',
  '🇺🇦 Ukraine',
  '🇵🇰 Pakistan',
  '🇮🇷 Iran',
  '🏳️‍🌈 Tezospride',
  'Art4Artists',
  'Image',
  'Video',
  'Audio',
  '3D',
  'HTML & SVG',
  'GIF',
  'PDF',
  'Markdown',
] as const

export type FeedType = (typeof FEED_LIST)[number]

export const DEFAULT_START_FEED: FeedType = 'New OBJKTs'

//- Mint stuff

export const ALLOWED_COVER_MIMETYPES = [
  MIMETYPE.JPEG,
  MIMETYPE.PNG,
  MIMETYPE.GIF,
]

export const AUTO_GENERATE_COVER_MIMETYPES = [
  'text/plain',
  'audio/midi',
  'audio/mid'
]

export const ALLOWED_COVER_FILETYPES_LABEL = 'jpeg, png, gif'
export const MAX_EDITIONS = 10000 // Limited by contract
export const MIN_ROYALTIES = 10
export const MAX_ROYALTIES = 25

export const IPFS_DEFAULT_THUMBNAIL_URI =
  'ipfs://QmNrhZHUaEqxhyLfqoq1mtHSipkWHeT31LNHb1QEbDHgnc'

export const MARKETPLACE_CONTRACT_V1 = 'KT1Hkg5qeNhfwpKW4fXvq7HGZB9z2EnmCCA9'
export const MARKETPLACE_CONTRACT_V2 = 'KT1HbQepzV1nVGg8QVznG7z4RcHseD5kwqBn'
export const MARKETPLACE_CONTRACT_TEIA = 'KT1PHubm9HtyQEJ4BBpMTVomq6mhbfNZ9z5w'
export const MARKETPLACE_CONTRACT_OBJKTCOM_V1 =
  'KT1FvqJwEDWb1Gwc55Jd1jjTHRVWbYKUUpyq'
export const MARKETPLACE_CONTRACT_OBJKTCOM_V4 =
  'KT1WvzYHCNBvDSdwafTHv7nJ1dWmZ8GCYuuC'

export const MARKETPLACE_CONTRACTS_FROM_NAME = {
  'HEN v1 Marketplace': MARKETPLACE_CONTRACT_V1,
  'HEN v2 Marketplace': MARKETPLACE_CONTRACT_V2,
  'Teia Marketplace': MARKETPLACE_CONTRACT_TEIA,
  'OBJKT v1 Marketplace': MARKETPLACE_CONTRACT_OBJKTCOM_V1,
  'OBJKT v4 Marketplace': MARKETPLACE_CONTRACT_OBJKTCOM_V4,
  'Crunchy Burner': 'KT1CZMurPAjSfZqcn6LBUNUhG4byE6AJgDT6',
}

export const MARKETPLACE_CONTRACTS_TO_NAME = flipObject(
  MARKETPLACE_CONTRACTS_FROM_NAME
)

export const HEN_CONTRACT_FA2 = 'KT1RJ6PbjHpwc3M5rw5s2Nbmefwbuwbdxton'
export const ART4ARTISTS_BREADFOND_CONTRACT = 'KT1LgnHXu8NVa674xJhSFhnKjrn7v2ZMsu2a'
export const TEZ4PAL_FUNDING_ADDRESS = 'tz2TfuukrHVoeUqFvcRViPJ2VqL7nEQi7xgW'
export const UKRAINE_FUNDING_CONTRACT = 'KT1DWnLiUkNtAQDErXxudFEH63JC6mqg3HEx'
export const PAKISTAN_FUNDING_CONTRACT = 'KT1Jpf2TAcZS7QfBraQMBeCxjFhH6kAdDL4z'
export const IRAN_FUNDING_CONTRACT = 'KT1KYfj97fpdomqyKsZSBdSVvh9afh93b4Ge'
export const QUAKE_FUNDING_CONTRACT = 'KT1X1jyohFrZyDYWvCPXw9KvWxk2VDwxyg2g'
export const COPYRIGHT_CONTRACT = 'KT1XAiMoaddkmLUhMYMrc3ghm9uBdLgVbiFK'
export const MOROCCO_QUAKE_FUNDING_CONTRACT =
  'KT1RwXEP8Sj1UQDHPG4oEjRohBdzG2R7FCpA'

export const POLLS_CONTRACT = 'KT1SUExZfkmxf2fafrVgYjZGEKDete2siWoU'
export const DAO_GOVERNANCE_CONTRACT = 'KT1GHX73W5BcjbYRSZSrUJcnZE3Uw92VYF66'
export const DAO_TREASURY_CONTRACT = 'KT1J9FYz29RBQi1oGLw8uXyACrzXzV1dHuvb'
export const TEIA_FOUNTAIN_CONTRACT = 'KT1EsvmkijLKPQmcJMbjDeKRXdwky1LWvwpG'
export const DAO_TOKEN_CONTRACT = 'KT1QrtA753MSv8VGxkDrKKyJniG5JtuHHbtV'

// Specific tz addresses to exclude from donation lists
export const DONATION_EXCLUDED_ADDRESSES = [
  'tz1cyUSeLA9Zpf2yGncQFFFNpMBgkrvgz7KQ', // Zir0h's bakery payouts
  'tz1gnuBF9TbBcgHPV2mUE96tBrW7PxqRmx1h', // Baking Benjamins Payouts
]

// Donations that were sent via a middleman and should be reassigned to the actual donor.
// Each entry moves `amount` tez and 1 donation count from `from` to `to`.
export const DONATION_REASSIGNMENTS = [
  {
    // Tezos Foundation donation sent via Ryan Tanaka
    // tx: ooKskSzgUPDq32uo757BuEGzhNF6Ks8nSRGFst8iQgtHi2z2hPz
    from: 'tz1ZVzMVj6EjRoDNFMCguG7nGdqmD7aau9kS',
    to: 'tz1Sb4KVyoe4zVpwdFH5R1U822hUWqGEMDWE',
    toAlias: 'Tezos Foundation',
    amount: 25481.22,
  },
]
export const DAO_TOKEN_CLAIM_CONTRACT = 'KT1NrfV4e2qWqFrnrKyPTJth5wq2KP9VyBei'
export const DISTRIBUTION_MAPPING_IPFS_PATH =
  'QmbRmck8A5sBYQC7WEuK8dApnGQGXBhyPEgQpLm8ftfAtL'
export const MERKLE_DATA_IPFS_PATHS = {
  0: 'QmUETPfQaoE2mTzBUMbXGk4VgJUqvitwmti2iuk7p1KUPa',
  1: 'Qme3evVseBhLhoK4iefXiSHnr2wegGVnPccCYKQWqrDuPy',
  2: 'QmdGaYaM1gdqqVVaApmwxdg5Mu5Ckkh9hdDSfnC6nP6G14',
  3: 'QmZQzGdwZgMa8aNwhyFiLy2rKHmyvfFpi6pYfdE3t7wHTV',
  4: 'QmbB2LyNoVEy6jZTZ66GZL4ousBxGA1EeiEV5vCWyH2Wkq',
  5: 'QmPi7kuiRLD2rV854AV8gfMYchQhamxcp4X16phnyzdPLR',
  6: 'QmdrhhjL2R49SYdwdPF3eEVU1GHDSdJ4Ykya3jvt7TdRTu',
  7: 'QmXiD3T5erwNAZ5yFYpz3AA2h6FXfPMt7XzKCDrKwJSMDX',
  8: 'QmW4jpn5EnjQx6aCbSAodEhh6BW2UqvZSGvubu2tv4UWCn',
}
export const CLAIMED_DAO_TOKENS_BIGMAP_ID = '518731'
export const DAO_TOKEN_DECIMALS = 1000000
export const TOKENS = [
  {
    name: 'TEIA',
    fa2: 'KT1QrtA753MSv8VGxkDrKKyJniG5JtuHHbtV',
    multiasset: false,
    decimals: DAO_TOKEN_DECIMALS,
    website: undefined,
  },
  {
    name: 'OBJKT',
    fa2: 'KT1RJ6PbjHpwc3M5rw5s2Nbmefwbuwbdxton',
    multiasset: true,
    decimals: 1,
    website: 'https://teia.art/objkt/',
  },
  {
    name: 'hDAO',
    fa2: 'KT1AFA2mwNUMNd4SsujE1YYp29vd8BZejyKW',
    multiasset: false,
    decimals: 1000000,
    website: undefined,
  },
]

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

export const TEIA_MULTISIG_BLOG_TAG = 'teiamultisigblog'

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

export const LICENSE_TYPES: { [key: string]: string } = {
  none: 'None (All rights reserved)',
  'cc-by-4.0': 'CC-BY-4.0 (Attribution)',
  'cc-by-sa-4.0': 'CC BY-SA 4.0 (Attribution ShareAlike)',
  'cc-by-nd-4.0': 'CC BY-ND 4.0 (Attribution-NoDerivs)',
  'cc-by-nc-4.0': 'CC BY-NC 4.0 (Attribution-NonCommercial)',
  'cc-by-nc-sa-4.0': 'CC BY-NC-SA 4.0 (Attribution-NonCommercial-ShareAlike)',
  'cc-by-nc-nd-4.0': 'CC BY-NC-ND 4.0 (Attribution-NonCommercial-NoDerivs)',
}

export const LICENSE_TYPES_OPTIONS = Object.keys(LICENSE_TYPES).map((k) => ({
  label: LICENSE_TYPES[k],
  value: k,
}))

export const THEMES: { [key: string]: string } = {
  dark: 'Dark',
  light: 'Light',
  kawaii: 'Kawaii',
  aqua: 'Aqua',
  coffee: 'Coffee',
  midnight: 'Midnight',
  grass: 'Grass',
  // noui: 'No UI (Expert Mode)',
}

export const THEME_OPTIONS = Object.keys(THEMES).map((m) => ({
  label: THEMES[m],
  value: m,
}))

export const LANGUAGES: { [key: string]: string } = {
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
export const METADATA_ACCESSIBILITY_HAZARDS_PHOTOSENS = 'flashing'

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
    name: 'Art4Artists Breadfond',
    address: 'KT1LgnHXu8NVa674xJhSFhnKjrn7v2ZMsu2a',
  },
  {
    name: 'Tez4Pal Fundraiser',
    address: 'tz2TfuukrHVoeUqFvcRViPJ2VqL7nEQi7xgW',
  },
  {
    name: 'TezQuakeAid Morocco Fundraiser',
    address: 'KT1RwXEP8Sj1UQDHPG4oEjRohBdzG2R7FCpA',
  },
  {
    name: 'TezQuakeAid Turkey/Syria Fundraiser',
    address: 'KT1X1jyohFrZyDYWvCPXw9KvWxk2VDwxyg2g',
  },
  {
    name: 'Tezos4Iran Fundraiser',
    address: 'KT1KYfj97fpdomqyKsZSBdSVvh9afh93b4Ge',
  },
  {
    name: 'SavePakistan Fundraiser',
    address: 'KT1Jpf2TAcZS7QfBraQMBeCxjFhH6kAdDL4z',
  },
  {
    name: 'Ukraine Relief Fundraiser',
    address: 'KT1DWnLiUkNtAQDErXxudFEH63JC6mqg3HEx',
  },
  {
    name: 'Teia Fountain Donations',
    address: 'KT1EsvmkijLKPQmcJMbjDeKRXdwky1LWvwpG',
  },
  {
    name: 'Community Representation/Equity Donations (Multisig)',
    address: 'KT1TGJGjh9oMntcny4J7eVn1NDPgCXimHqss',
  },
  {
    name: 'WG3.2 (collab contract dev team)',
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
