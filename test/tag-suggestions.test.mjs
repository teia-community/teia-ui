import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  stripMarkdown,
  tokenize,
  suggestTags,
  toVocabulary,
  appendTag,
} from '../src/utils/tag-suggestions.mjs'

const vocabulary = toVocabulary(
  JSON.parse(
    readFileSync(new URL('../src/data/tag-vocabulary.json', import.meta.url))
  ).tags
)

test('the committed vocabulary looks usable', () => {
  assert.ok(vocabulary.size > 500, 'expected a few hundred tags at least')
  assert.ok(vocabulary.has('illustration'))
  assert.ok(vocabulary.has('pixelart'))
  for (const tag of vocabulary.keys()) {
    assert.match(tag, /^[a-z0-9][a-z0-9-]*$/, `unusable tag: ${tag}`)
  }
})

test('stripMarkdown drops code, embeds, images and urls but keeps link text', () => {
  const md = [
    '# A heading',
    '```js',
    'const generative = 1',
    '```',
    'Some `inline` text with [a portrait link](https://teia.art/objkt/1).',
    '![alt text](ipfs://abc)',
    '<!-- teia-token:{"token_id":"1"} -->',
    'Visit https://example.com now',
  ].join('\n')
  const out = stripMarkdown(md)
  assert.ok(out.includes('A heading'))
  assert.ok(out.includes('a portrait link'))
  assert.ok(!out.includes('const generative'))
  assert.ok(!out.includes('teia-token'))
  assert.ok(!out.includes('ipfs://abc'))
  assert.ok(!out.includes('example.com'))
})

test('tokenize keeps 3d, drops stopwords, numbers and single letters', () => {
  const words = tokenize('A 3d render of 12 the surreal x landscapes')
  assert.deepEqual(words, ['3d', 'render', 'surreal', 'landscapes'])
})

test('suggests tags Teia already uses, most mentioned first', () => {
  const text =
    'A generative animation loop. The animation explores generative pattern work.'
  const tags = suggestTags(text, { vocabulary })
  assert.ok(tags.includes('generative'))
  assert.ok(tags.includes('animation'))
  assert.ok(tags.includes('loop'))
  assert.ok(
    tags.indexOf('generative') < tags.indexOf('loop'),
    'repeated words should rank above single mentions'
  )
})

test('joins two-word phrases the way Teia writes them', () => {
  const tags = suggestTags('A pixel art study of a city', { vocabulary })
  assert.ok(tags.includes('pixelart'), `expected pixelart in ${tags}`)
})

test('matches a plural in the text to the singular tag', () => {
  const tags = suggestTags('A series of portraits, painted portraits', {
    vocabulary,
  })
  assert.ok(tags.includes('portrait'), `expected portrait in ${tags}`)
})

test('never suggests a tag the user already has', () => {
  const text = 'A generative animation loop, very generative'
  const tags = suggestTags(text, {
    vocabulary,
    existing: ['generative', ' Animation '],
  })
  assert.ok(!tags.includes('generative'))
  assert.ok(!tags.includes('animation'))
})

test('falls back to repeated words that are not in the vocabulary', () => {
  const tags = suggestTags(
    'A study of zzxqq shapes, more zzxqq, always zzxqq here',
    { vocabulary }
  )
  assert.ok(tags.includes('zzxqq'), `expected the repeated word in ${tags}`)
})

test('ignores words that are useless as tags, and words mentioned once', () => {
  const tags = suggestTags(
    'This artwork is a piece from a series. An edition of one qqunique thing.',
    { vocabulary }
  )
  for (const junk of ['artwork', 'piece', 'series', 'edition', 'qqunique']) {
    assert.ok(!tags.includes(junk), `should not suggest ${junk}`)
  }
})

test('returns nothing for empty or wordless input, and respects the limit', () => {
  assert.deepEqual(suggestTags('', { vocabulary }), [])
  assert.deepEqual(suggestTags('   \n  ', { vocabulary }), [])
  assert.deepEqual(suggestTags('```code only```', { vocabulary }), [])
  const many = suggestTags(
    'abstract generative animation loop glitch portrait photography collage',
    { vocabulary, limit: 3 }
  )
  assert.equal(many.length, 3)
})

test('a tag the user has used before outranks an equally mentioned common tag', () => {
  const tags = suggestTags('A glitch collage study', {
    vocabulary,
    personal: new Set(['collage']),
  })
  assert.ok(
    tags.indexOf('collage') < tags.indexOf('glitch'),
    `expected collage before glitch in ${tags}`
  )
})

test("suggests the user's own tag even when Teia has no such tag", () => {
  const tags = suggestTags('A qqpersonal study of light', {
    vocabulary,
    personal: new Set(['qqpersonal']),
  })
  assert.ok(tags.includes('qqpersonal'), `expected qqpersonal in ${tags}`)
})

test('appendTag keeps existing tags and skips duplicates', () => {
  assert.equal(appendTag('', 'glitch'), 'glitch')
  assert.equal(appendTag('art', 'glitch'), 'art, glitch')
  assert.equal(appendTag('art, glitch', 'glitch'), 'art, glitch')
  assert.equal(appendTag('art, Glitch', ' GLITCH '), 'art, Glitch')
  assert.equal(appendTag('art,  ,', 'loop'), 'art, loop')
})

test('an established two-word tag folds in the weaker word it is made of', () => {
  const tags = suggestTags('A pixel art study, more pixel art', { vocabulary })
  assert.ok(tags.includes('pixelart'))
  // pixelart is used more than pixel, so pixel is folded in...
  assert.ok(!tags.includes('pixel'), `pixel should be folded in: ${tags}`)
  // ...but art is a bigger tag in its own right and survives.
  assert.ok(tags.includes('art'), `art should survive: ${tags}`)
})

test('a rare compound never displaces the common tags it is made of', () => {
  // loopanimation exists on Teia but with a handful of uses, against ~600 for
  // loop and ~1300 for animation.
  const tags = suggestTags('A loop animation, another loop animation', {
    vocabulary,
  })
  assert.ok(tags.includes('animation'), `expected animation in ${tags}`)
  assert.ok(tags.includes('loop'), `expected loop in ${tags}`)
  assert.ok(!tags.includes('loopanimation'), `too rare to suggest: ${tags}`)
})
