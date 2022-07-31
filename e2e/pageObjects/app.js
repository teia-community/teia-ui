import { root, scroll } from './index'

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

export const scrollToBottom = async () => {
  const app = await root()
  for (let i = 0; i < 100; i++) {
    await app.evaluate(scroll, { direction: 'down', speed: 'fast' })
    await delay(500)
  }
  return true
}
