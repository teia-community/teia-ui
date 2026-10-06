// Suggests tags for a description, entirely in the browser.
//
// Words from the description are matched against the tags Teia already uses
// (src/data/tag-vocabulary.json), so a suggestion is usually a tag with a
// populated tag page behind it rather than a spelling only this user will ever
// write. Words that are clearly being repeated but are not in the vocabulary
// are offered afterwards, so a new subject can still be tagged.
//
// Nothing here calls out: no model, no network, no analytics.

/** Common words that carry no subject meaning. */
const STOPWORDS = new Set(
  `a about after all also am an and any are as at be because been before being
  but by can cant come could did do does doing dont down each even every few for
  from get gets getting go goes going got had has have having he her here hers
  him his how i if in into is it its just like made make makes making many may
  me might more most much must my no nor not now of off on once one only or
  other our out over own part people put re said same see she should since so
  some still such take than that the their them then there these they thing
  things this those through time to too under until up us use used using very
  via want was way we well were what when where which while who why will with
  within without would you your yours`.split(/\s+/)
)

/** Words that are technically fine but useless as tags on an art platform. */
const TOO_GENERIC = new Set([
  'artwork',
  'edition',
  'editions',
  'image',
  'mint',
  'minted',
  'nft',
  'piece',
  'pieces',
  'series',
  'work',
  'works',
])

/**
 * Strips markdown so code, links and embeds don't feed the word counts.
 * @param {string} text
 */
export function stripMarkdown(text) {
  return String(text || '')
    .replace(/```[\s\S]*?```/g, ' ') // fenced code
    .replace(/`[^`]*`/g, ' ') // inline code
    .replace(/<!--[\s\S]*?-->/g, ' ') // html comments (teia token embeds)
    .replace(/<[^>]+>/g, ' ') // html tags
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ') // images
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1') // links, keep the text
    .replace(/https?:\/\/\S+/g, ' ') // bare urls
    .replace(/^\s{0,3}#{1,6}\s+/gm, '') // heading markers
    .replace(/[*_~>|]/g, ' ') // emphasis, quotes, tables
}

/**
 * Words worth considering, in order of appearance. Keeps things like "3d".
 * @param {string} text
 * @returns {string[]}
 */
export function tokenize(text) {
  return (stripMarkdown(text).toLowerCase().match(/[a-z0-9]+/g) || []).filter(
    (word) =>
      word.length >= 2 &&
      word.length <= 30 &&
      !/^\d+$/.test(word) &&
      !STOPWORDS.has(word)
  )
}

/** How established a two-word tag must be before it is suggested. */
const MIN_PAIR_USES = 50

/**
 * Teia's tags have no spaces, so "pixel art" is written "pixelart".
 * @returns {Map<string, {inText: number, parts: string[]}>}
 */
function joinedPairs(words) {
  const pairs = new Map()
  for (let i = 0; i < words.length - 1; i++) {
    const parts = [words[i], words[i + 1]]
    const joined = parts.join('')
    if (joined.length > 30) continue
    const seen = pairs.get(joined)
    if (seen) seen.inText++
    else pairs.set(joined, { inText: 1, parts })
  }
  return pairs
}

/** Normalises a user-typed tag the way both forms store them. */
export function normalizeTag(tag) {
  return String(tag || '')
    .trim()
    .toLowerCase()
}

/**
 * @param {string} text description or post body
 * @param {object} options
 * @param {Map<string, number>} options.vocabulary tag -> how often Teia uses it
 * @param {Set<string>} [options.personal] tags this user has used before, which
 *   rank above the shared vocabulary and count even on a single mention
 * @param {string[]} [options.existing] tags already chosen, never re-suggested
 * @param {number} [options.limit]
 * @returns {string[]} suggested tags, most relevant first
 */
export function suggestTags(
  text,
  { vocabulary, personal = new Set(), existing = [], limit = 8 }
) {
  const words = tokenize(text)
  if (words.length === 0) return []

  const taken = new Set(existing.map(normalizeTag).filter(Boolean))
  const counts = new Map()
  for (const word of words) counts.set(word, (counts.get(word) || 0) + 1)

  const known = []
  const unknown = []
  const seen = new Set()

  const consider = (candidate, inText) => {
    if (!candidate || seen.has(candidate) || taken.has(candidate)) return false
    const mine = personal.has(candidate)
    const uses = vocabulary.get(candidate)
    if (!mine && !uses) return false
    seen.add(candidate)
    known.push({ tag: candidate, inText, uses: uses || 0, mine })
    return true
  }

  // Two-word tags first ("pixel art" -> pixelart), then single words, then
  // singulars ("portraits" -> portrait) when the plural isn't itself a tag.
  // A matched pair swallows its own words, so "pixelart" does not arrive
  // alongside "pixel" and "art".
  const consumed = new Set()
  for (const [pair, { inText, parts }] of joinedPairs(words)) {
    // Only established compounds: "pixelart" yes, "loopanimation" (8 uses) no,
    // otherwise a rare compound displaces the common tags it is made of.
    const uses = vocabulary.get(pair) || 0
    if (uses < MIN_PAIR_USES && !personal.has(pair)) continue
    if (!consider(pair, inText)) continue
    // And it only replaces a word when it is the more used form of it, so
    // "pixelart" folds in "pixel" but leaves "art" alone.
    for (const part of parts) {
      if ((vocabulary.get(part) || 0) <= uses) consumed.add(part)
    }
  }
  for (const [word, inText] of counts) {
    if (!consumed.has(word)) consider(word, inText)
  }
  for (const [word, inText] of counts) {
    if (word.endsWith('s') && word.length > 4 && !consumed.has(word)) {
      consider(word.slice(0, -1), inText)
    }
  }

  // Fallback: a word repeated in the description that Teia has no tag for yet.
  for (const [word, inText] of counts) {
    if (seen.has(word) || taken.has(word) || vocabulary.has(word)) continue
    if (consumed.has(word)) continue
    if (inText < 2 || word.length < 4 || TOO_GENERIC.has(word)) continue
    seen.add(word)
    unknown.push({ tag: word, inText })
  }

  // Mentioned most often first; between equals, the user's own tags win.
  known.sort(
    (a, b) => b.inText - a.inText || b.mine - a.mine || b.uses - a.uses
  )
  unknown.sort((a, b) => b.inText - a.inText || b.tag.length - a.tag.length)

  return [...known, ...unknown]
    .filter(({ tag }) => !TOO_GENERIC.has(tag))
    .slice(0, limit)
    .map(({ tag }) => tag)
}

/**
 * Adds a tag to a comma separated field, keeping what the user typed and
 * ignoring a tag that is already there.
 * @param {string} value
 * @param {string} tag
 */
export function appendTag(value, tag) {
  const clean = normalizeTag(tag)
  if (!clean) return String(value || '')
  const current = String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
  if (current.some((item) => normalizeTag(item) === clean)) {
    return String(value || '')
  }
  return [...current, clean].join(', ')
}

/** Builds the lookup the suggester needs from the committed vocabulary file. */
export function toVocabulary(entries) {
  return new Map(entries)
}
