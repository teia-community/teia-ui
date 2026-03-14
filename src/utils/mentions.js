const MENTION_PATTERN = /@(tz[1-3][1-9A-HJ-NP-Za-km-z]{33})/g

function mentionRegex() {
  return new RegExp(MENTION_PATTERN.source, 'g')
}

/**
 * Extract all unique Tezos addresses mentioned in content
 */
export function extractMentionAddresses(content) {
  if (!content) return []
  const matches = []
  const re = mentionRegex()
  let match
  while ((match = re.exec(content)) !== null) {
    matches.push(match[1])
  }
  return [...new Set(matches)]
}

/**
 * Parse content into segments of plain text and extract mention addresses
 */
export function parseMentions(content) {
  if (!content) return []
  const segments = []
  const re = mentionRegex()
  let lastIndex = 0
  let match
  while ((match = re.exec(content)) !== null) {
    if (match.index > lastIndex) {
      segments.push({
        type: 'text',
        value: content.slice(lastIndex, match.index),
      })
    }
    segments.push({ type: 'mention', value: match[1] })
    lastIndex = match.index + match[0].length
  }
  if (lastIndex < content.length) {
    segments.push({ type: 'text', value: content.slice(lastIndex) })
  }
  return segments
}

/**
 * Detect @query at cursor position in text.
 */
export function getMentionQuery(text, cursorPos) {
  const before = text.slice(0, cursorPos)
  const match = before.match(/@(\S*)$/)
  if (!match) return null
  return { query: match[1], start: match.index }
}
