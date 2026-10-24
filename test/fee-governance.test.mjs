import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  feeSetter,
  feeField,
  readFeeAction,
} from '../src/utils/fee-governance.mjs'

test('a stored fee maps to the entrypoint that proposes a new value', () => {
  assert.equal(feeSetter('post_fee'), 'set_post_fee')
  assert.equal(feeSetter('propose_page_fee'), 'set_propose_page_fee')
})

test('and back again', () => {
  assert.equal(feeField('set_create_fee'), 'create_fee')
  assert.equal(feeField('set_propose_edit_fee'), 'propose_edit_fee')
})

test('a proposal action reads as the fee it changes and the new value', () => {
  assert.deepEqual(readFeeAction({ set_post_fee: '25000' }), {
    entrypoint: 'set_post_fee',
    value: '25000',
  })
  assert.deepEqual(readFeeAction({ set_edit_fee: 0 }), {
    entrypoint: 'set_edit_fee',
    value: '0',
  })
})

test('an action we do not understand is skipped, not guessed at', () => {
  assert.equal(readFeeAction(null), null)
  assert.equal(readFeeAction({}), null)
  // Pausing the contract or moving the recipient is a proposal too, but not
  // one this page knows how to describe.
  assert.equal(readFeeAction({ set_user_banned: { address: 'tz1', banned: true } }), null)
})
