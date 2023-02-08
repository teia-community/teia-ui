import { test /*expect*/, Page } from '@playwright/test'
import { randomUUID } from 'crypto'

const session = randomUUID()
const baseUrl = 'http://localhost:3000'
// const baseUrl = "https://teia.art"

const users = [
  'afterviz',
  'mel',
  // True john
  'jjjjjohn',
  // Fake John
  'jjjjjohn',
]
const user = users[0]

const themes = ['light', 'dark', 'kawai', 'midnight', 'aqua', 'coffee']
const pages = ['', user, 'settings']
const theme_duration = 1500

/** Cycles thought all the themes and await the callback after each theme change. */
const cycleThemes = async (
  page: Page,
  onCycle: (theme: string) => Promise<void>,
  timeout = 1000
) => {
  for (const theme of themes) {
    await page.evaluate((theme) => {
      document.documentElement.setAttribute('data-theme', theme)
    }, theme)
    await page.waitForTimeout(timeout)
    await onCycle(theme)
  }
}

test('screenshots feeds menu', async ({ page }, workerInfo) => {
  await page.goto(baseUrl)
  await page.waitForLoadState('networkidle')
  await page
    .getByRole('button', { name: 'feeds selection dropdown' })
    .click({ timeout: 5000 })
  await page.waitForTimeout(theme_duration)

  await cycleThemes(page, async (theme: string) => {
    await page.screenshot({
      path: `screenshot/${session}/${workerInfo.project.name}-feeds_menu-${theme}.png`,
    })
  })
})

test('screenshots events menu', async ({ page }, workerInfo) => {
  await page.goto(`${baseUrl}/settings`)
  await page.waitForLoadState()

  await page
    .getByRole('button', { name: 'events dropdown' })
    .click({ timeout: 2500 })

  await page.waitForTimeout(theme_duration)

  await cycleThemes(page, async (theme) => {
    await page.screenshot({
      path: `screenshot/${session}/${workerInfo.project.name}-events_menu-${theme}.png`,
    })
  })
})

test('screenshots main menu', async ({ page }, workerInfo) => {
  await page.goto(`${baseUrl}/settings`)
  await page.waitForLoadState()

  await page.getByRole('button', { name: 'show menu' }).click({ timeout: 2500 })

  await page.waitForTimeout(theme_duration)

  await cycleThemes(page, async (theme) => {
    await page.screenshot({
      path: `screenshot/${session}/${workerInfo.project.name}-main_menu-${theme}.png`,
    })
  })
})

// Create the same tests for all given pages
for (const path of pages) {
  const page_name = path === '' ? 'home' : path

  test(`screenshots page ${page_name}`, async ({ page }, workerInfo) => {
    const project = workerInfo.project.name

    await page.goto(`${baseUrl}/${path}`)
    await page.waitForLoadState()

    try {
      const masonry = page.getByRole('button', { name: 'masonry view mode' })
      if (masonry) {
        await masonry.click({ timeout: 2500 })
        await page.waitForTimeout(1000)
      }
    } catch (e) {
      console.log('no masonry view mode on current page.')
      console.error(e)
    }
    await page.waitForLoadState('networkidle')

    //- Profile tabs
    // await page.getByRole('link', { name: 'Collabs' }).click();
    // await page.getByRole('link', { name: 'Creations' }).click();
    // await page.getByRole('link', { name: 'Collection' }).click();

    //- Config Theme Dropdown
    // await page.getByRole("button", { name: "show menu" }).click();
    // await page.getByRole("button", { name: "local settings" }).click();
    // await page.locator(".react_select__input-container").click();
    // await page.getByText("Light", { exact: true }).click();
    // await page.locator(".react_select__input-container").click();
    // await page.getByText("Kawai", { exact: true }).click();
    // await page.locator(".react_select__input-container").click();
    // await page.getByText("Aqua", { exact: true }).click();
    // await page.locator(".react_select__input-container").click();
    // await page.getByText("Coffee", { exact: true }).click();

    await cycleThemes(page, async (theme) => {
      await page.screenshot({
        path: `screenshot/${session}/${project}-${page_name}-${theme}.png`,
      })
    })
  })
}
