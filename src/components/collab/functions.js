import { Parser } from '@taquito/michel-codec'
import { Schema } from '@taquito/michelson-encoder'

export const packData = (rawData, schema) => {
  const parser = new Parser()
  const michelsonType = parser.parseData(schema)
  const parsedSchema = new Schema(michelsonType)
  const data = parsedSchema.Encode(rawData)

  return {
    data,
    type: michelsonType,
  }
}

export const validAddress = (input) => {
  if (!input.length) {
    return false
  }

  const isAddressFormat =
    ['tz', 'KT'].indexOf(input.substr(0, 2)) > -1 && input.length === 36

  // TODO: add .tez support
  // const isTezFormat = /^.*\.tez$/.test(input)

  // return isAddressFormat || isTezFormat
  return isAddressFormat
}

export const extractAddress = (input) => {
  let matches

  // const tezDomainPattern = /^(.*\.tez)$/i
  // matches = tezDomainPattern.exec(input.trim())
  // if (matches) {
  //   return matches[1]
  // }

  // Check tz
  const tzPattern = /^.*(tz[\w\d]{34}).*$/i
  matches = tzPattern.exec(input.trim())
  if (matches) {
    return matches[1]
  }

  // Check for KT contract patterns
  const ktPattern = /^.*(kt[\w\d]{34}).*$/i
  matches = ktPattern.exec(input.trim())

  if (!matches) {
    return false
  }

  return matches[1]
}

export const groupShareTotal = (collaborators) =>
  collaborators.reduce(
    (sharesAllocated, c) => (c.shares || 0) + sharesAllocated,
    0
  )

export function userHasSignedObjkt({ objktId, address, creator }) {
  if (!address) {
    return false
  }

  const signedObjktsForAddress = creator.shares[0].shareholder
    .filter(
      ({ holder_type, holder_id }) =>
        holder_type === 'core_participant' && holder_id === address
    )
    .map((participant) => participant.holder.holder_signatures)

  return signedObjktsForAddress.map((o) => o.token_id).includes(objktId)
}

// @marchingsquare
export async function resolveTezosDomain(domain) {
  try {
    const result = await fetch('https://api.tezos.domains/graphql', {
      headers: {
        'content-type': 'application/json',
      },
      method: 'POST',
      mode: 'cors',
      credentials: 'omit',
      body: JSON.stringify({
        query:
          'query resolveDomain($domain: String!) {\n  domain(name: $domain) {\n    address\n  }\n}\n',
        variables: { domain },
        operationName: 'resolveDomain',
      }),
    })

    const response = await result.json()
    return response?.data?.domain?.address || ''
  } catch (err) {
    return ''
  }
}
