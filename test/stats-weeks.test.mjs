import { test } from 'node:test'
import assert from 'node:assert/strict'
import { weekBuckets, tezFromMutez } from '../src/utils/stats-weeks.mjs'

const NOW = Date.parse('2026-10-24T17:00:00Z')

test('the buckets run oldest first and end after today', () => {
  const weeks = weekBuckets(4, NOW)
  assert.equal(weeks.length, 4)
  assert.ok(weeks[0].from < weeks[3].from)
  assert.ok(Date.parse(weeks[3].to) > NOW)
})

test('each bucket is exactly a week, and they join without a gap', () => {
  const weeks = weekBuckets(5, NOW)
  for (const w of weeks) {
    assert.equal(Date.parse(w.to) - Date.parse(w.from), 7 * 86_400_000)
  }
  for (let i = 1; i < weeks.length; i += 1) {
    assert.equal(weeks[i].from, weeks[i - 1].to)
  }
})

test('the label is the day the week starts', () => {
  const [week] = weekBuckets(1, NOW)
  assert.equal(week.week, week.from.slice(0, 10))
})

test('mutez read as tez, and nonsense reads as nothing', () => {
  assert.equal(tezFromMutez(65_756_769_992), 65756.769992)
  assert.equal(tezFromMutez('2500000'), 2.5)
  assert.equal(tezFromMutez(null), 0)
  assert.equal(tezFromMutez(undefined), 0)
})
