const axios = require('axios')

export const BaseTokenFieldsFragment = `
fragment baseTokenFields on tokens {
  fa2_address
  token_id
  name
  description
  editions
  minted_at
  thumbnail_uri
  display_uri
  artifact_uri
  artist_address
  artist_profile {
    name
  }
  teia_meta {
    accessibility
    content_rating
    is_signed
  }
  royalties
  mime_type
  price
}
`

/**
 * Get OBJKT detail page
 */
export const GetOBJKT = async ({ id }) => {
  return new Promise((resolve, reject) => {
    axios
      .get(process.env.REACT_APP_OBJKT, {
        params: { id: id },
      })
      .then((res) => {
        // console.log(res.data)
        resolve(res.data.result)
      })
      .catch((e) => reject(e))
  })
}

/**
 * Get User claims from their tzprofile
 */
const GetUserClaims = async (walletAddr) => {
  return await axios.post('https://indexer.tzprofiles.com/v1/graphql', {
    query: `query MyQuery { tzprofiles_by_pk(account: "${walletAddr}") { valid_claims } }`,
    variables: null,
    operationName: 'MyQuery',
  })
}

/**
 * Get User Metadata
 */
export const GetUserMetadata = async (walletAddr) => {
  const tzktData = {}

  const tzpData = {}
  try {
    const claims = await GetUserClaims(walletAddr)
    if (claims.data.data.tzprofiles_by_pk !== null)
      for (const claim of claims.data.data.tzprofiles_by_pk.valid_claims) {
        const claimJSON = JSON.parse(claim[1])
        if (claimJSON.type.includes('TwitterVerification')) {
          if (!tzktData.data || !tzktData.data.twitter) {
            tzpData.twitter = claimJSON.evidence.handle
          }
        } else if (claimJSON.type.includes('BasicProfile')) {
          if (claimJSON.credentialSubject.alias !== '' && !tzktData.data?.alias)
            tzpData.alias = claimJSON.credentialSubject.alias
          tzpData.tzprofile = walletAddr
        } else if (claimJSON.type.includes('DiscordVerification')) {
          if (!tzktData.data) {
            tzpData.discord = claimJSON.evidence.handle
          }
        } else if (claimJSON.type.includes('GitHubVerification')) {
          if (!tzktData.data) {
            tzpData.github = claimJSON.evidence.handle
          }
        } else if (
          claimJSON.type.includes('DnsVerification') &&
          !tzktData.data
        ) {
          tzpData.dns = claimJSON.credentialSubject.sameAs.slice(4)
        }
      }
  } catch (e) {
    console.error(e, e.stack)
  }

  if (tzpData) {
    tzktData.data = tzpData
  }
  return tzktData
}
