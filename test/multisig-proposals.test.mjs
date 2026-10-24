import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  proposalStatus,
  expiresAt,
  summariseVotes,
  kindLabel,
  timeUntil,
  describeProposal,
  quorumProgress,
  formatTokenAmount,
  toSmallestUnit,
} from '../src/utils/multisig-proposals.mjs'

const NOW = Date.parse('2026-10-24T00:00:00Z')

test('an executed proposal is executed whatever its age', () => {
  const old = { executed: true, timestamp: '2022-01-01T00:00:00Z' }
  assert.equal(proposalStatus(old, 10, NOW), 'executed')
})

test('an unexecuted proposal expires once the window passes', () => {
  const inside = { executed: false, timestamp: '2026-10-20T00:00:00Z' }
  const outside = { executed: false, timestamp: '2026-10-01T00:00:00Z' }
  assert.equal(proposalStatus(inside, 10, NOW), 'active')
  assert.equal(proposalStatus(outside, 10, NOW), 'expired')
})

test('the boundary belongs to the proposal, not to expiry', () => {
  const exactly = { executed: false, timestamp: '2026-10-14T00:00:00Z' }
  // Ten days later to the millisecond is still votable.
  assert.equal(proposalStatus(exactly, 10, NOW), 'active')
  assert.equal(proposalStatus(exactly, 10, NOW + 1), 'expired')
})

test('an unreadable date is left active rather than declared dead', () => {
  assert.equal(proposalStatus({ executed: false, timestamp: '' }, 10, NOW), 'active')
  const p = { executed: false, timestamp: '2026-10-01T00:00:00Z' }
  assert.equal(proposalStatus(p, undefined, NOW), 'active')
})

test('expiry is the proposal date plus the window', () => {
  const p = { timestamp: '2026-10-14T00:00:00Z' }
  assert.equal(expiresAt(p, 10), '2026-10-24T00:00:00.000Z')
  assert.equal(expiresAt({ timestamp: 'nonsense' }, 10), null)
})

test('non-voters are pending while live and abstaining once settled', () => {
  const votes = [{ inFavour: true }, { inFavour: true }, { inFavour: false }]
  const live = summariseVotes(votes, 21, 'active')
  assert.deepEqual(
    [live.inFavour, live.against, live.silent, live.silentLabel],
    [2, 1, 18, 'pending']
  )
  assert.equal(summariseVotes(votes, 21, 'executed').silentLabel, 'abstain')
})

test('a vote count above the membership never goes negative', () => {
  const votes = [{ inFavour: true }, { inFavour: true }]
  assert.equal(summariseVotes(votes, 1).silent, 0)
})

test('proposal kinds get short labels, unknown ones fall back', () => {
  assert.equal(kindLabel('transfer_mutez'), 'XTZ')
  assert.equal(kindLabel('transfer_token'), 'FA2')
  assert.equal(kindLabel('remove_user'), '−MEM')
  assert.equal(kindLabel('something_new'), 'SOMETHING_NEW')
})

test('a deadline is phrased forwards, not as a negative time ago', () => {
  const base = Date.parse('2026-10-24T00:00:00Z')
  const at = (mins) => new Date(base + mins * 60000).toISOString()
  assert.equal(timeUntil(at(64), base), 'in 1 hour')
  assert.equal(timeUntil(at(130), base), 'in 2 hours')
  assert.equal(timeUntil(at(60 * 24 * 3), base), 'in 3 days')
  assert.equal(timeUntil(at(5), base), 'in 5 minutes')
  assert.equal(timeUntil(at(1), base), 'in 1 minute')
})

test('a deadline already passed does not read as the future', () => {
  const base = Date.parse('2026-10-24T00:00:00Z')
  assert.equal(timeUntil('2026-10-23T00:00:00Z', base), 'any moment')
  assert.equal(timeUntil('nonsense', base), null)
})

test('a tez transfer says how much and where it goes', () => {
  const one = describeProposal({
    rawKind: 'transfer_mutez',
    mutezTransfers: [{ amount: '1436000000', destination: 'tz1gpVD4ftf9GG' }],
  })
  assert.match(one, /^Transfer 1,436 ꜩ to tz1gp…/)

  const many = describeProposal({
    rawKind: 'transfer_mutez',
    mutezTransfers: [
      { amount: '1436000000', destination: 'a' },
      { amount: '482000000', destination: 'b' },
    ],
  })
  assert.equal(many, 'Transfer 1,918 ꜩ across 2 destinations')
})

test('a token transfer is written in the token, not its smallest unit', () => {
  const proposal = {
    rawKind: 'transfer_token',
    tokenTransfers: {
      fa2: 'KT1Tether',
      tokenId: '0',
      distribution: [{ amount: '3100000000', destination: 'tz1WJpBDRGfa21' }],
    },
  }
  const text = describeProposal(proposal, {
    tokenInfo: () => ({ symbol: 'USDt', decimals: 6 }),
  })
  assert.match(text, /^Transfer 3,100 USDt to tz1WJ…/)
})

test('a token with no metadata shows its raw figure, not a guessed one', () => {
  const text = describeProposal({
    rawKind: 'transfer_token',
    tokenTransfers: {
      fa2: 'KT1Unknown',
      tokenId: '7',
      distribution: [{ amount: '450000', destination: 'tz1WJpBDRGfa21' }],
    },
  })
  assert.match(text, /^Transfer 450,000 to tz1WJ…/)
})

test('membership proposals name the member when an alias is known', () => {
  const p = { rawKind: 'remove_user', user: 'tz1M7n1Fpvf' }
  assert.equal(
    describeProposal(p, { aliasOf: () => 'Kelly Richardson' }),
    'Remove Kelly Richardson from the multisig'
  )
  assert.match(describeProposal(p), /^Remove tz1M7…/)
})

test('a transfer with nothing recorded still describes itself', () => {
  assert.equal(
    describeProposal({ rawKind: 'transfer_mutez', mutezTransfers: [] }),
    'Transfer tez from the treasury'
  )
})

test('quorum progress is a share of the votes needed, clamped', () => {
  assert.equal(quorumProgress(0, 10), 0)
  assert.equal(quorumProgress(8, 10), 0.8)
  assert.equal(quorumProgress(12, 10), 1)
  assert.equal(quorumProgress(5, 0), 0)
})

test('token amounts read as a person would say them', () => {
  const usdt = { symbol: 'USDt', decimals: 6 }
  assert.equal(formatTokenAmount('3100000000', usdt), '3,100 USDt')
  assert.equal(formatTokenAmount('1100000000', usdt), '1,100 USDt')
  assert.equal(formatTokenAmount('500000', usdt), '0.5 USDt')
  // 18 decimals is the case that breaks a hardcoded divisor.
  assert.equal(
    formatTokenAmount('2500000000000000000', { symbol: 'WETH.e', decimals: 18 }),
    '2.5 WETH.e'
  )
  // A token with no decimals is shown whole, not divided by a guess.
  assert.equal(formatTokenAmount('42', { symbol: 'UP', decimals: 0 }), '42 UP')
})

test('an unreadable token amount is shown rather than invented', () => {
  assert.equal(formatTokenAmount(undefined, { symbol: 'X' }), '')
  assert.equal(formatTokenAmount('abc', { symbol: 'X' }), 'abc')
})

test('what a person types converts to the units the contract wants', () => {
  assert.equal(toSmallestUnit('3100', 6), 3100000000)
  assert.equal(toSmallestUnit('3,100', 6), 3100000000)
  assert.equal(toSmallestUnit('0.5', 6), 500000)
  assert.equal(toSmallestUnit('42', 0), 42)
})

test('the float that would make 0.07 into 69999.99 is rounded away', () => {
  assert.equal(toSmallestUnit('0.07', 6), 70000)
  assert.equal(toSmallestUnit('1.1', 6), 1100000)
  assert.equal(toSmallestUnit('0.000001', 6), 1)
})

test('an amount that cannot be converted exactly is refused, not guessed', () => {
  assert.equal(toSmallestUnit('', 6), null)
  assert.equal(toSmallestUnit('abc', 6), null)
  assert.equal(toSmallestUnit('-5', 6), null)
  // Beyond what a JS integer holds exactly, so the contract must not be sent it.
  assert.equal(toSmallestUnit('1000000000000', 18), null)
})
