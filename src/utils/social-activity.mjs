// Describing a social activity row that carries no text.
//
// Posting an OBJKT with no words is a normal thing to do in a channel, but the
// activity feed showed those rows as "(empty)", which reads like something
// went wrong. They are described by what they actually are instead.

/**
 * @param {{fa2: string, tokenId: string}[]} [embeds]
 * @param {Record<string, string>} [names] tokenId -> token name, when known
 * @returns {string} '' when there is nothing to describe
 */
export function describeEmbeds(embeds, names = {}) {
  const list = (embeds || []).filter((embed) => embed && embed.tokenId)
  if (list.length === 0) return ''

  if (list.length === 1) {
    const { tokenId } = list[0]
    const name = (names[String(tokenId)] || '').trim()
    return name ? `Shared “${name}”` : `Shared OBJKT #${tokenId}`
  }

  return `Shared ${list.length} OBJKTs`
}

/**
 * What a row should show in its content column.
 * @param {string} content message text
 * @param {{fa2: string, tokenId: string}[]} [embeds]
 * @param {Record<string, string>} [names]
 */
export function socialRowSummary(content, embeds, names = {}) {
  const text = String(content || '').trim()
  if (text !== '') return { kind: 'text', text }

  const described = describeEmbeds(embeds, names)
  if (described) return { kind: 'embed', text: described }

  // Nothing at all: an edit that cleared the message, or a stray payload.
  return { kind: 'empty', text: 'No text' }
}

/** Every token id referenced by a list of activity items, for one bulk lookup. */
export function embedTokenIds(items) {
  const ids = new Set()
  for (const item of items || []) {
    for (const embed of item?.embeds || []) {
      if (embed?.tokenId) ids.add(String(embed.tokenId))
    }
  }
  return [...ids]
}
