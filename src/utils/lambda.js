import { encodeAddress, encodeKeyHash } from '@taquito/utils'
import { Parser, emitMicheline } from '@taquito/michel-codec'

export function parseLambda(lambdaCode) {
  // Transform the lambda function Michelson JSON code to Micheline code
  const parser = new Parser()
  const michelsonCode = parser.parseJSON(JSON.parse(lambdaCode))
  const michelineCode = emitMicheline(michelsonCode, {
    indent: '    ',
    newline: '\n',
  })

  // Encode any addresses that the Micheline code might contain
  const encodedMichelineCode = michelineCode
    .replace(
      /0x0[0123]{1}[\w\d]{42}/g,
      (match) => `"${encodeAddress(match.slice(2))}"`
    )
    .replace(
      /0x0[0123]{1}[\w\d]{40}/g,
      (match) => `"${encodeKeyHash(match.slice(2))}"`
    )

  return encodedMichelineCode
}
