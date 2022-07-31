import { browserType, launchConfig, contextConfig } from '../playwright.config'

const rootSelector = '#root'
let browser, context, page

export const root = async () => await page.$(rootSelector)

export const load = async () => {
  browser = await browserType.launch(launchConfig)
  context = await browser.newContext(contextConfig)
  page = await context.newPage()
  await page.goto(baseURL, { waitUntil: 'networkidle' })
}

export const close = async () => await browser.close()

export const getTitle = async () => await page.title()

export const scroll = async (dom, args) => {
  const { direction, speed } = args

  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
  const scrollHeight = () => document.body.scrollHeight
  //   const start = direction === 'down' ? 0 : scrollHeight()
  const start = () => document.documentElement.scrollTop
  const shouldStop = (position) =>
    direction === 'down' ? position > scrollHeight() : position < 0
  const increment = direction === 'down' ? 100 : -100
  const delayTime = speed === 'slow' ? 50 : 10
  console.error(start(), shouldStop(start()), increment)
  for (let i = start(); !shouldStop(i); i += increment) {
    window.scrollTo(0, i)
    await delay(delayTime)
  }
}
