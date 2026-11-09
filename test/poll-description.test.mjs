import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parsePollDescription } from '../src/utils/poll-description.mjs'

test('an empty description is nothing to render', () => {
  assert.deepEqual(parsePollDescription(''), { kind: 'none' })
  assert.deepEqual(parsePollDescription('   '), { kind: 'none' })
  assert.deepEqual(parsePollDescription(undefined), { kind: 'none' })
})

test('older polls point at a text file on ipfs', () => {
  assert.deepEqual(
    parsePollDescription('ipfs://QmS3BSBmUa9Twe5v7tzASDaivGMGDf6EYMYSJYTUYMa7D1'),
    { kind: 'ipfs', cid: 'QmS3BSBmUa9Twe5v7tzASDaivGMGDf6EYMYSJYTUYMa7D1' }
  )
})

test('newer polls carry the description itself', () => {
  const written = 'Why this poll exists.\n\nWhat each option means.'
  assert.deepEqual(parsePollDescription(written), {
    kind: 'text',
    text: written,
  })
})

test('text that merely mentions a link is still text', () => {
  const written = 'Background at https://teia.art/poll/42 — please read first.'
  assert.deepEqual(parsePollDescription(written), {
    kind: 'text',
    text: written,
  })
})

test('a description that starts with other protocols is text, not a pointer', () => {
  for (const written of [
    'https://example.com/doc.txt',
    'see ipfs://QmSomething for the full text',
  ]) {
    assert.equal(parsePollDescription(written).kind, 'text', written)
  }
})
