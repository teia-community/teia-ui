import { Page } from '@atoms/layout'
import { GlobalActivityFeed } from '@pages/home/feeds/teia-activity-feed'

/** Top-level platform-wide Teia activity feed (/activity). */
export default function TeiaActivity() {
  return (
    <Page feed title="Teia Activity">
      <GlobalActivityFeed />
    </Page>
  )
}
