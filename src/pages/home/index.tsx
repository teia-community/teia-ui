// TODO (mel & xat) - best way to handle filter composition?
import { Input } from '@atoms/input'
import { Page } from '@atoms/layout'
import { useState, FunctionComponent } from 'react'
import {
  createSearchParams,
  useNavigate,
  useOutlet,
  useSearchParams,
} from 'react-router-dom'
import type { FeedType } from '@constants'
import { useLocalSettings } from '@context/localSettingsStore'
import * as FEEDS from './feeds'
import SubjktsSearchResults from './subjkts-search-results'

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
  'HTML & SVG': FEEDS.HtmlSvgFeed,
  PDF: FEEDS.PdfFeed,
  Markdown: FEEDS.MarkdownFeed,
  GIF: FEEDS.GifFeed,
  Friends: FEEDS.FriendsFeed,
}

export function Home({ isSearch = false }) {
  const outlet = useOutlet()
  const [searchParams] = useSearchParams()
  const [searchTerm, setSearchTerm] = useState(searchParams.get('term') || '')
  const navigate = useNavigate()
  const [startFeed] = useLocalSettings((st) => [st.startFeed])
  const FeedComponent = feedComponentMap[startFeed] || DefaultFeedComponent

  return (
    <Page feed={!isSearch} title="Home">
      <>
        {isSearch && (
          <Input
            type="text"
            name="Enter a search term and press enter:"
            onChange={(value) => {
              setSearchTerm(value as string)
            }}
            placeholder="Search ↵"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                navigate(
                  {
                    pathname: '/search',
                    search: createSearchParams({
                      term: searchTerm,
                    }).toString(),
                  },
                  { replace: true }
                )
              }
            }}
            value={searchTerm}
          />
        )}
      </>
      <>
        {isSearch && searchParams.get('term') ? <SubjktsSearchResults /> : null}
      </>
      {isSearch ? (
        searchParams.get('term') ? (
          <FEEDS.SearchFeed />
        ) : (
          <></>
        )
      ) : (
        outlet || <FeedComponent />
      )}
    </Page>
  )
}
