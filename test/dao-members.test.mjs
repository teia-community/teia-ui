import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  buildMembers,
  sortMembers,
  tallyVotes,
  withActivity,
} from '../src/utils/dao-members.mjs'

const ACCEPTS = [
  { address: 'tz1aaa', alias: 'Ada', timestamp: '2022-11-02T00:00:00Z' },
  { address: 'tz1bbb', alias: 'bo', timestamp: '2023-04-01T00:00:00Z' },
  { address: 'tz1ccc', alias: 'Cy', timestamp: '2022-11-09T00:00:00Z' },
]

test('anyone who accepted but is no longer listed is emeritus', () => {
  const members = buildMembers({
    currentUsers: ['tz1aaa', 'tz1bbb'],
    acceptances: ACCEPTS,
    removals: [{ user: 'tz1ccc', timestamp: '2023-06-01T00:00:00Z' }],
  })
  const cy = members.find((m) => m.address === 'tz1ccc')
  assert.equal(cy.isCurrent, false)
  assert.equal(cy.left, '2023-06-01T00:00:00Z')
  assert.equal(cy.joined, '2022-11-09T00:00:00Z')
  assert.equal(members.filter((m) => m.isCurrent).length, 2)
})

test('a member who left and came back is current, with no departure shown', () => {
  const members = buildMembers({
    currentUsers: ['tz1ccc'],
    acceptances: [
      { address: 'tz1ccc', timestamp: '2022-11-09T00:00:00Z' },
      { address: 'tz1ccc', timestamp: '2024-02-01T00:00:00Z' },
    ],
    removals: [{ user: 'tz1ccc', timestamp: '2023-06-01T00:00:00Z' }],
  })
  assert.equal(members.length, 1)
  assert.equal(members[0].isCurrent, true)
  assert.equal(members[0].left, null)
  // The rejoin is the join date that means anything.
  assert.equal(members[0].joined, '2024-02-01T00:00:00Z')
})

test('a current member with no acceptance on record still appears', () => {
  const members = buildMembers({
    currentUsers: ['tz1zzz'],
    acceptances: [],
    removals: [],
  })
  assert.deepEqual(members, [
    {
      address: 'tz1zzz',
      alias: null,
      joined: null,
      left: null,
      isCurrent: true,
    },
  ])
})

test('name sort ignores case and falls back to the address', () => {
  const members = [
    { address: 'tz1bbb', alias: 'bo' },
    { address: 'tz1aaa', alias: 'Ada' },
    { address: 'tz1yyy', alias: null },
  ]
  assert.deepEqual(
    sortMembers(members, 'name').map((m) => m.alias || m.address),
    ['Ada', 'bo', 'tz1yyy']
  )
})

test('join sort is longest-serving first, unknown joins last', () => {
  const members = buildMembers({
    currentUsers: ['tz1aaa', 'tz1bbb', 'tz1zzz'],
    acceptances: ACCEPTS,
    removals: [],
  })
  assert.deepEqual(
    sortMembers(members, 'joined').map((m) => m.address),
    ['tz1aaa', 'tz1ccc', 'tz1bbb', 'tz1zzz']
  )
})

test('tokens and votes sort highest first', () => {
  const members = [
    { address: 'a', tokens: 10, votesCast: 1 },
    { address: 'b', tokens: 50, votesCast: 9 },
  ]
  assert.deepEqual(
    sortMembers(members, 'tokens').map((m) => m.address),
    ['b', 'a']
  )
  assert.deepEqual(
    sortMembers(members, 'votes').map((m) => m.address),
    ['b', 'a']
  )
})

test('votes are tallied per member, keeping each record', () => {
  const tallies = tallyVotes([
    { proposalId: '1', address: 'tz1aaa', inFavour: true },
    { proposalId: '2', address: 'tz1aaa', inFavour: false },
    { proposalId: '1', address: 'tz1bbb', inFavour: true },
  ])
  assert.equal(tallies.get('tz1aaa').votesCast, 2)
  assert.equal(tallies.get('tz1aaa').votesInFavour, 1)
  assert.equal(tallies.get('tz1aaa').votes.length, 2)
  assert.equal(tallies.get('tz1bbb').votesCast, 1)
})

test('a member who never voted reads as zero rather than missing', () => {
  const withIt = withActivity([{ address: 'tz1aaa' }], {
    tallies: new Map(),
    tokens: {},
  })
  assert.equal(withIt[0].votesCast, 0)
  assert.equal(withIt[0].tokens, 0)
  assert.deepEqual(withIt[0].votes, [])
})
