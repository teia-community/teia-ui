import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  describeEmbeds,
  socialRowSummary,
  embedTokenIds,
} from '../src/utils/social-activity.mjs'

const embed = (tokenId) => ({ fa2: 'KT1RJ6Pbj', tokenId })

test('text wins when the message has any', () => {
  const summary = socialRowSummary('  hello everyone  ', [embed('885267')])
  assert.deepEqual(summary, { kind: 'text', text: 'hello everyone' })
})

test('a wordless post is described by the OBJKT it shared', () => {
  assert.deepEqual(socialRowSummary('', [embed('885267')]), {
    kind: 'embed',
    text: 'Shared OBJKT #885267',
  })
})

test('the OBJKT name is used when it is known', () => {
  assert.equal(
    describeEmbeds([embed('885267')], { 885267: 'Clarity to Creatives' }),
    'Shared “Clarity to Creatives”'
  )
})

test('several OBJKTs are counted rather than listed', () => {
  assert.equal(
    describeEmbeds([embed('1'), embed('2'), embed('3')], { 1: 'One' }),
    'Shared 3 OBJKTs'
  )
})

test('a blank name falls back to the token id', () => {
  assert.equal(
    describeEmbeds([embed('885267')], { 885267: '   ' }),
    'Shared OBJKT #885267'
  )
})

test('nothing at all says so plainly, never "(empty)"', () => {
  for (const embeds of [undefined, [], [{ fa2: 'KT1', tokenId: '' }]]) {
    assert.deepEqual(socialRowSummary('   ', embeds), {
      kind: 'empty',
      text: 'No text',
    })
  }
})

test('token ids are collected across items, without duplicates', () => {
  const items = [
    { embeds: [embed('1'), embed('2')] },
    { embeds: [embed('2')] },
    { embeds: [] },
    {},
  ]
  assert.deepEqual(embedTokenIds(items).sort(), ['1', '2'])
  assert.deepEqual(embedTokenIds(undefined), [])
})
