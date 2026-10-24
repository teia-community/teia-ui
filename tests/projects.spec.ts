import { test, expect } from '@playwright/test'

const fixture = {
  slug: 'test-initiative',
  title: 'Test initiative',
  summary: 'A synthetic community project.',
  description: 'Project description.',
  status: 'active',
  initiator: { name: 'Test initiator' },
  contributors: [
    { name: 'Test contributor', url: 'https://example.com/person' },
  ],
  needs: [
    {
      title: 'Translation',
      description: 'Help translate documentation.',
      open: true,
      url: '/publicchannels',
    },
  ],
  updates: [
    { date: '2026-09-01', title: 'First update', body: 'Work has started.' },
  ],
  events: [{ title: 'Community meeting', url: '/calendar/event/test-meeting' }],
  links: [
    { label: 'DAO proposal', url: '/dao' },
    {
      label: 'GitHub repository',
      url: 'https://github.com/teia-community/teia-ui',
    },
  ],
}

test('empty catalogue, views and missing project recovery', async ({
  page,
}) => {
  await page.goto('http://localhost:3000/projects')
  await expect(
    page.getByRole('heading', { name: 'No active projects yet' })
  ).toBeVisible()
  await page.getByRole('button', { name: 'show menu' }).click()
  const community = page
    .getByRole('dialog', { name: 'Main menu' })
    .locator('section')
    .filter({ has: page.getByRole('heading', { name: 'Community & DAO' }) })
  await expect(
    community.getByRole('link', { name: 'Projects', exact: true })
  ).toBeVisible()
  await community.getByRole('link', { name: 'Projects', exact: true }).click()
  await page.getByRole('link', { name: 'Open Calls (0)' }).click()
  await expect(page).toHaveURL(/view=open-calls/)
  await expect(
    page.getByRole('heading', { name: 'No open calls yet' })
  ).toBeVisible()
  await page.reload()
  await expect(
    page.getByRole('link', { name: 'Open Calls (0)' })
  ).toHaveAttribute('aria-current', 'page')
  await page.getByRole('link', { name: 'Completed (0)' }).click()
  await expect(
    page.getByRole('heading', { name: 'No completed projects yet' })
  ).toBeVisible()
  await page.goto('http://localhost:3000/projects/unknown')
  await expect(
    page.getByRole('heading', { name: 'Project not found' })
  ).toBeVisible()
  await page.getByRole('link', { name: 'all projects' }).click()
  await expect(
    page.getByRole('heading', { name: 'Projects', exact: true })
  ).toBeVisible()
})

test('project filtering, detail and responsive themes', async ({
  page,
}, testInfo) => {
  await page.route('**/src/data/projects/projects.json*', (route) =>
    route.fulfill({
      contentType: 'application/javascript',
      body: `export default ${JSON.stringify([
        fixture,
        {
          ...fixture,
          slug: 'finished',
          title: 'Finished initiative',
          status: 'completed',
        },
        {
          ...fixture,
          slug: 'planning',
          title: 'Planning initiative',
          status: 'planning',
          needs: [],
        },
      ])}`,
    })
  )
  await page.goto('http://localhost:3000/projects')
  await expect(page.getByRole('link', { name: 'Active (2)' })).toBeVisible()
  await page.screenshot({
    path: testInfo.outputPath('index.png'),
    fullPage: true,
  })
  await page.getByRole('link', { name: 'Open Calls (1)' }).click()
  await expect(
    page.getByRole('link', { name: 'Planning initiative' })
  ).toHaveCount(0)
  await page.getByRole('link', { name: 'Test initiative', exact: true }).click()
  await expect(
    page.getByRole('heading', { name: 'People', exact: true })
  ).toBeVisible()
  await expect(
    page.getByText('Test contributor', { exact: true })
  ).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Translation' })).toBeVisible()
  await expect(page.getByText('Work has started.')).toBeVisible()
  await expect(
    page.getByRole('link', { name: 'Community meeting' })
  ).toHaveAttribute('href', '/calendar/event/test-meeting')
  await expect(
    page.getByRole('link', { name: 'GitHub repository' })
  ).toHaveAttribute('rel', 'noopener noreferrer')
  for (const theme of ['light', 'dark']) {
    await page.evaluate(
      (value) => document.documentElement.setAttribute('data-theme', value),
      theme
    )
    // Allow the shared 333ms theme transition to settle before visual inspection.
    await page.waitForTimeout(500)
    await page.screenshot({
      path: testInfo.outputPath(`detail-${theme}.png`),
      fullPage: true,
    })
  }
  await page.setViewportSize({ width: 375, height: 812 })
  await expect
    .poll(() =>
      page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth
      )
    )
    .toBe(true)
  await page.screenshot({
    path: testInfo.outputPath('detail-mobile.png'),
    fullPage: true,
  })
  await page.goto('http://localhost:3000/projects?view=completed')
  await page.getByRole('link', { name: 'Finished initiative' }).click()
  await expect(
    page.getByText('This project is complete. Its calls are closed.')
  ).toBeVisible()
  await expect(page.getByRole('link', { name: 'Get involved' })).toHaveCount(0)
})
