const MENTION_PATTERN = /@(tz[1-3][1-9A-HJ-NP-Za-km-z]{33})/g

function mentionRegex() {
  return new RegExp(MENTION_PATTERN.source, 'g')
}

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

export function getMentionQuery(text, cursorPos) {
  const before = text.slice(0, cursorPos)
  const match = before.match(/@(\S*)$/)
  if (!match) return null
  return { query: match[1], start: match.index }
}
