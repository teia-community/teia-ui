import { chromium, firefox, webkit, devices } from 'playwright'

// const iPhone = devices['iPhone 6'];
const desktop = devices['Desktop Chrome']

module.exports = {
  browserType: chromium,
  launchConfig: {
    headless: false,
    slowMo: 1000,
  },
  contextConfig: {
    viewport: desktop.viewport,
    userAgent: desktop.userAgent,
  },
}
