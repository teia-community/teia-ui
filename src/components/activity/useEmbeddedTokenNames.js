import { useObjktsByIds } from '@data/swr'
import { embedTokenIds } from '@utils/social-activity.mjs'

/**
 * Names for every OBJKT posted in a list of social activity items, so a
 * wordless post can be described by what it shared. One batched lookup for the
 * whole page, and no request at all when nothing on it has an embed.
 *
 * @param {object[]} items
 * @returns {Record<string, string>} tokenId -> name
 */
export function useEmbeddedTokenNames(items) {
  const tokens = useObjktsByIds(embedTokenIds(items))
  const names = {}
  for (const [tokenId, token] of Object.entries(tokens)) {
    if (token?.name) names[tokenId] = token.name
  }
  return names
}
