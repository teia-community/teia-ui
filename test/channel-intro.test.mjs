import { test } from 'node:test'
import assert from 'node:assert/strict'
import { introRepeatsFirstMessage } from '../src/utils/channel-intro.mjs'

test('an identical first message makes the description redundant', () => {
  const text = 'A gathering place for TREE. Share your Teia photos here.'
  assert.equal(introRepeatsFirstMessage(text, text), true)
})

test('matches through escaped newlines and uneven spacing', () => {
  // Seen on channel 34: the description has real newlines, the message that
  // repeats it carries literal \n characters.
  const description = 'This is a public forum.\n\nThe plan is to meet weekly.'
  const message = 'This is a public forum.\\n\\nThe plan is to meet weekly.'
  assert.equal(introRepeatsFirstMessage(description, message), true)
})

test('matches when the first message starts with the description then adds more', () => {
  assert.equal(
    introRepeatsFirstMessage(
      'Ask anything about Tezos.',
      'Ask anything about Tezos. I will answer every Friday.'
    ),
    true
  )
})

test('a different first message keeps the description', () => {
  assert.equal(
    introRepeatsFirstMessage('A room about music.', 'hey everyone, welcome!'),
    false
  )
})

test('an empty description or an empty room is never a repeat', () => {
  assert.equal(introRepeatsFirstMessage('', 'hello'), false)
  assert.equal(introRepeatsFirstMessage('A room about music.', ''), false)
  assert.equal(introRepeatsFirstMessage(undefined, undefined), false)
})
