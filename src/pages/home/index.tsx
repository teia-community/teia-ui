// TODO (mel & xat) - best way to handle filter composition?
import { Page } from '@atoms/layout'
import { FunctionComponent, useState } from 'react'
import { useOutlet } from 'react-router-dom'
import type { FeedType } from '@constants'
import { useLocalSettings } from '@context/localSettingsStore'
import { useModalStore } from '@context/modalStore'
import { Hint } from '@components/tour'
import * as FEEDS from './feeds'
import Search from './search'

const DefaultFeedComponent = FEEDS.RecentSalesFeed

type FeedComponentMap = {
  [key in FeedType]: FunctionComponent<Record<string, unknown>>
}

export const feedComponentMap: FeedComponentMap = {
  'Recent Sales': FEEDS.RecentSalesFeed,
  'Art4Artists': FEEDS.Art4ArtistsFeed,
  '🏳️‍🌈 Tezospride': FEEDS.TagFeed as FunctionComponent<Record<string, unknown>>,
  '🇮🇷 Iran': FEEDS.IranFeed,
  'Quake Aid': FEEDS.QuakeFeed,
  '🇵🇰 Pakistan': FEEDS.PakistanFeed,
  '🇺🇦 Ukraine': FEEDS.UkraineFeed,
  '🇵🇸 Tez4Pal': FEEDS.Tez4PalFeed,
  Random: FEEDS.RandomFeed,
  'New OBJKTs': FEEDS.NewObjktsFeed,
  '3D': FEEDS.GlbFeed,
  Video: FEEDS.VideoFeed,
  Image: FEEDS.ImageFeed,
  Audio: FEEDS.AudioFeed,
  'Code Art': FEEDS.HtmlSvgFeed,
  PDF: FEEDS.PdfFeed,
  Markdown: FEEDS.MarkdownFeed,
  GIF: FEEDS.GifFeed,
  Friends: FEEDS.FriendsFeed,
}

/** Points at the menu on every visit; hidden while the menu is open or once closed. */
function ExploreHint() {
  const [closed, setClosed] = useState(false)
  const menuOpen = useModalStore((st) => !st.collapsed)

  if (closed || menuOpen) return null
  return (
    <Hint target="menu" title="Explore More" onClose={() => setClosed(true)} />
  )
}

export function Home({ isSearch = false }) {
  const outlet = useOutlet()
  const [startFeed] = useLocalSettings((st) => [st.startFeed])
  const FeedComponent = feedComponentMap[startFeed] || DefaultFeedComponent

  return (
    <Page feed={!isSearch} title="Home">
      <>
        {!isSearch && !outlet && <ExploreHint />}
        {isSearch ? <Search /> : outlet || <FeedComponent />}
      </>
    </Page>
  )
}
