import { load, close, getTitle } from '../pageObjects'

describe('Teia', () => {
  beforeEach(async () => {
    await load()
  })

  afterEach(async () => {
    await close()
  })

  it("should be titled 'teia'", async () => {
    expect(await getTitle()).toBe('teia')
  })
})
