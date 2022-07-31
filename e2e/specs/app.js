import { scrollToBottom } from '../pageObjects/app'
import { load, close } from '../pageObjects/index'

describe('Teia', () => {
  beforeEach(async () => {
    await load()
  })

  afterEach(async () => {
    await close()
  })

  it('scroll the feed', async () => {
    expect(await scrollToBottom()).toBe(true)
  })
})
