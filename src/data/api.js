const axios = require('axios')

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
 * Get OBJKT detail page
 */
export const GetTags = async ({ tag, counter }) => {
  return new Promise((resolve, reject) => {
    axios
      .post(process.env.REACT_APP_TAGS, { tag: tag, counter: counter })
      .then((res) => {
        // console.log(res.data)
        resolve(res.data.result)
      })
      .catch((e) => reject(e)) // TODO: send error message to context. have an error component to display the error
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
  let tzktData = {}

  let tzpData = {}
  try {
    let claims = await GetUserClaims(walletAddr)
    if (claims.data.data.tzprofiles_by_pk !== null)
      for (const claim of claims.data.data.tzprofiles_by_pk.valid_claims) {
        let claimJSON = JSON.parse(claim[1])
        if (claimJSON.type.includes('TwitterVerification')) {
          if (!tzktData.data || !tzktData.data.twitter) {
            tzpData['twitter'] = claimJSON.evidence.handle
          }
        } else if (claimJSON.type.includes('BasicProfile')) {
          if (
            claimJSON.credentialSubject.alias !== '' &&
            !(tzktData.data && tzktData.data.alias)
          )
            tzpData['alias'] = claimJSON.credentialSubject.alias
          tzpData['tzprofile'] = walletAddr
        } else if (claimJSON.type.includes('DiscordVerification')) {
          if (!tzktData.data) {
            tzpData['discord'] = claimJSON.evidence.handle
          }
        } else if (claimJSON.type.includes('GitHubVerification')) {
          if (!tzktData.data) {
            tzpData['github'] = claimJSON.evidence.handle
          }
        } else if (claimJSON.type.includes('DnsVerification')) {
          if (!tzktData.data) {
            tzpData['dns'] = claimJSON.credentialSubject.sameAs.slice(4)
          }
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
