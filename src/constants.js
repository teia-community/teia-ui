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
  AD: '🇦🇩 Andorra',
  AE: '🇦🇪 United Arab Emirates',
  AF: '🇦🇫 Afghanistan',
  AG: '🇦🇬 Antigua and Barbuda',
  AI: '🇦🇮 Anguilla',
  AL: '🇦🇱 Albania',
  AM: '🇦🇲 Armenia',
  AO: '🇦🇴 Angola',
  AQ: '🇦🇶 Antarctica',
  AR: '🇦🇷 Argentina',
  AS: '🇦🇸 American Samoa',
  AT: '🇦🇹 Austria',
  AU: '🇦🇺 Australia',
  AW: '🇦🇼 Aruba',
  AX: '🇦🇽 Åland Islands',
  AZ: '🇦🇿 Azerbaijan',
  BA: '🇧🇦 Bosnia and Herzegovina',
  BB: '🇧🇧 Barbados',
  BD: '🇧🇩 Bangladesh',
  BE: '🇧🇪 Belgium',
  BF: '🇧🇫 Burkina Faso',
  BG: '🇧🇬 Bulgaria',
  BH: '🇧🇭 Bahrain',
  BI: '🇧🇮 Burundi',
  BJ: '🇧🇯 Benin',
  BL: '🇧🇱 Saint Barthélemy',
  BM: '🇧🇲 Bermuda',
  BN: '🇧🇳 Brunei Darussalam',
  BO: '🇧🇴 Bolivia',
  BQ: '🇧🇶 Bonaire',
  BR: '🇧🇷 Brazil',
  BS: '🇧🇸 Bahamas',
  BT: '🇧🇹 Bhutan',
  BV: '🇧🇻 Bouvet Island',
  BW: '🇧🇼 Botswana',
  BY: '🇧🇾 Belarus',
  BZ: '🇧🇿 Belize',
  CA: '🇨🇦 Canada',
  CC: '🇨🇨 Cocos (Keeling) Islands',
  CD: '🇨🇩 Congo',
  CF: '🇨🇫 Central African Republic',
  CG: '🇨🇬 Congo',
  CH: '🇨🇭 Switzerland',
  CI: "🇨🇮 Côte D'Ivoire",
  CK: '🇨🇰 Cook Islands',
  CL: '🇨🇱 Chile',
  CM: '🇨🇲 Cameroon',
  CN: '🇨🇳 China',
  CO: '🇨🇴 Colombia',
  CR: '🇨🇷 Costa Rica',
  CU: '🇨🇺 Cuba',
  CV: '🇨🇻 Cape Verde',
  CW: '🇨🇼 Curaçao',
  CX: '🇨🇽 Christmas Island',
  CY: '🇨🇾 Cyprus',
  CZ: '🇨🇿 Czech Republic',
  DE: '🇩🇪 Germany',
  DJ: '🇩🇯 Djibouti',
  DK: '🇩🇰 Denmark',
  DM: '🇩🇲 Dominica',
  DO: '🇩🇴 Dominican Republic',
  DZ: '🇩🇿 Algeria',
  EC: '🇪🇨 Ecuador',
  EE: '🇪🇪 Estonia',
  EG: '🇪🇬 Egypt',
  EH: '🇪🇭 Western Sahara',
  ER: '🇪🇷 Eritrea',
  ES: '🇪🇸 Spain',
  ET: '🇪🇹 Ethiopia',
  FI: '🇫🇮 Finland',
  FJ: '🇫🇯 Fiji',
  FK: '🇫🇰 Falkland Islands (Malvinas)',
  FM: '🇫🇲 Micronesia',
  FO: '🇫🇴 Faroe Islands',
  FR: '🇫🇷 France',
  GA: '🇬🇦 Gabon',
  GB: '🇬🇧 United Kingdom',
  GD: '🇬🇩 Grenada',
  GE: '🇬🇪 Georgia',
  GF: '🇬🇫 French Guiana',
  GG: '🇬🇬 Guernsey',
  GH: '🇬🇭 Ghana',
  GI: '🇬🇮 Gibraltar',
  GL: '🇬🇱 Greenland',
  GM: '🇬🇲 Gambia',
  GN: '🇬🇳 Guinea',
  GP: '🇬🇵 Guadeloupe',
  GQ: '🇬🇶 Equatorial Guinea',
  GR: '🇬🇷 Greece',
  GS: '🇬🇸 South Georgia',
  GT: '🇬🇹 Guatemala',
  GU: '🇬🇺 Guam',
  GW: '🇬🇼 Guinea-Bissau',
  GY: '🇬🇾 Guyana',
  HK: '🇭🇰 Hong Kong',
  HM: '🇭🇲 Heard Island and Mcdonald Islands',
  HN: '🇭🇳 Honduras',
  HR: '🇭🇷 Croatia',
  HT: '🇭🇹 Haiti',
  HU: '🇭🇺 Hungary',
  ID: '🇮🇩 Indonesia',
  IE: '🇮🇪 Ireland',
  IL: '🇮🇱 Israel',
  IM: '🇮🇲 Isle of Man',
  IN: '🇮🇳 India',
  IO: '🇮🇴 British Indian Ocean Territory',
  IQ: '🇮🇶 Iraq',
  IR: '🇮🇷 Iran',
  IS: '🇮🇸 Iceland',
  IT: '🇮🇹 Italy',
  JE: '🇯🇪 Jersey',
  JM: '🇯🇲 Jamaica',
  JO: '🇯🇴 Jordan',
  JP: '🇯🇵 Japan',
  KE: '🇰🇪 Kenya',
  KG: '🇰🇬 Kyrgyzstan',
  KH: '🇰🇭 Cambodia',
  KI: '🇰🇮 Kiribati',
  KM: '🇰🇲 Comoros',
  KN: '🇰🇳 Saint Kitts and Nevis',
  KP: '🇰🇵 North Korea',
  KR: '🇰🇷 South Korea',
  KW: '🇰🇼 Kuwait',
  KY: '🇰🇾 Cayman Islands',
  KZ: '🇰🇿 Kazakhstan',
  LA: "🇱🇦 Lao People's Democratic Republic",
  LB: '🇱🇧 Lebanon',
  LC: '🇱🇨 Saint Lucia',
  LI: '🇱🇮 Liechtenstein',
  LK: '🇱🇰 Sri Lanka',
  LR: '🇱🇷 Liberia',
  LS: '🇱🇸 Lesotho',
  LT: '🇱🇹 Lithuania',
  LU: '🇱🇺 Luxembourg',
  LV: '🇱🇻 Latvia',
  LY: '🇱🇾 Libya',
  MA: '🇲🇦 Morocco',
  MC: '🇲🇨 Monaco',
  MD: '🇲🇩 Moldova',
  ME: '🇲🇪 Montenegro',
  MF: '🇲🇫 Saint Martin (French Part)',
  MG: '🇲🇬 Madagascar',
  MH: '🇲🇭 Marshall Islands',
  MK: '🇲🇰 Macedonia',
  ML: '🇲🇱 Mali',
  MM: '🇲🇲 Myanmar',
  MN: '🇲🇳 Mongolia',
  MO: '🇲🇴 Macao',
  MP: '🇲🇵 Northern Mariana Islands',
  MQ: '🇲🇶 Martinique',
  MR: '🇲🇷 Mauritania',
  MS: '🇲🇸 Montserrat',
  MT: '🇲🇹 Malta',
  MU: '🇲🇺 Mauritius',
  MV: '🇲🇻 Maldives',
  MW: '🇲🇼 Malawi',
  MX: '🇲🇽 Mexico',
  MY: '🇲🇾 Malaysia',
  MZ: '🇲🇿 Mozambique',
  NA: '🇳🇦 Namibia',
  NC: '🇳🇨 New Caledonia',
  NE: '🇳🇪 Niger',
  NF: '🇳🇫 Norfolk Island',
  NG: '🇳🇬 Nigeria',
  NI: '🇳🇮 Nicaragua',
  NL: '🇳🇱 Netherlands',
  NO: '🇳🇴 Norway',
  NP: '🇳🇵 Nepal',
  NR: '🇳🇷 Nauru',
  NU: '🇳🇺 Niue',
  NZ: '🇳🇿 New Zealand',
  OM: '🇴🇲 Oman',
  PA: '🇵🇦 Panama',
  PE: '🇵🇪 Peru',
  PF: '🇵🇫 French Polynesia',
  PG: '🇵🇬 Papua New Guinea',
  PH: '🇵🇭 Philippines',
  PK: '🇵🇰 Pakistan',
  PL: '🇵🇱 Poland',
  PM: '🇵🇲 Saint Pierre and Miquelon',
  PN: '🇵🇳 Pitcairn',
  PR: '🇵🇷 Puerto Rico',
  PS: '🇵🇸 Palestinian Territory',
  PT: '🇵🇹 Portugal',
  PW: '🇵🇼 Palau',
  PY: '🇵🇾 Paraguay',
  QA: '🇶🇦 Qatar',
  RE: '🇷🇪 Réunion',
  RO: '🇷🇴 Romania',
  RS: '🇷🇸 Serbia',
  RU: '🇷🇺 Russia',
  RW: '🇷🇼 Rwanda',
  SA: '🇸🇦 Saudi Arabia',
  SB: '🇸🇧 Solomon Islands',
  SC: '🇸🇨 Seychelles',
  SD: '🇸🇩 Sudan',
  SE: '🇸🇪 Sweden',
  SG: '🇸🇬 Singapore',
  SH: '🇸🇭 Saint Helena',
  SI: '🇸🇮 Slovenia',
  SJ: '🇸🇯 Svalbard and Jan Mayen',
  SK: '🇸🇰 Slovakia',
  SL: '🇸🇱 Sierra Leone',
  SM: '🇸🇲 San Marino',
  SN: '🇸🇳 Senegal',
  SO: '🇸🇴 Somalia',
  SR: '🇸🇷 Suriname',
  SS: '🇸🇸 South Sudan',
  ST: '🇸🇹 Sao Tome and Principe',
  SV: '🇸🇻 El Salvador',
  SX: '🇸🇽 Sint Maarten (Dutch Part)',
  SY: '🇸🇾 Syrian Arab Republic',
  SZ: '🇸🇿 Swaziland',
  TC: '🇹🇨 Turks and Caicos Islands',
  TD: '🇹🇩 Chad',
  TF: '🇹🇫 French Southern Territories',
  TG: '🇹🇬 Togo',
  TH: '🇹🇭 Thailand',
  TJ: '🇹🇯 Tajikistan',
  TK: '🇹🇰 Tokelau',
  TL: '🇹🇱 Timor-Leste',
  TM: '🇹🇲 Turkmenistan',
  TN: '🇹🇳 Tunisia',
  TO: '🇹🇴 Tonga',
  TR: '🇹🇷 Turkey',
  TT: '🇹🇹 Trinidad and Tobago',
  TV: '🇹🇻 Tuvalu',
  TW: '🇹🇼 Taiwan',
  TZ: '🇹🇿 Tanzania',
  UA: '🇺🇦 Ukraine',
  UG: '🇺🇬 Uganda',
  UM: '🇺🇲 United States Minor Outlying Islands',
  US: '🇺🇸 United States',
  UY: '🇺🇾 Uruguay',
  UZ: '🇺🇿 Uzbekistan',
  VA: '🇻🇦 Vatican City',
  VC: '🇻🇨 Saint Vincent and The Grenadines',
  VE: '🇻🇪 Venezuela',
  VG: '🇻🇬 Virgin Islands, British',
  VI: '🇻🇮 Virgin Islands, U.S.',
  VN: '🇻🇳 Viet Nam',
  VU: '🇻🇺 Vanuatu',
  WF: '🇼🇫 Wallis and Futuna',
  WS: '🇼🇸 Samoa',
  YE: '🇾🇪 Yemen',
  YT: '🇾🇹 Mayotte',
  ZA: '🇿🇦 South Africa',
  ZM: '🇿🇲 Zambia',
  ZW: '🇿🇼 Zimbabwe',
}
