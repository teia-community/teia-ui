// TODO (mel & xat) - best way to handle filter composition?
import { Input } from '@atoms/input'
import { Page } from '@atoms/layout'
import { useState } from 'react'
import {
  createSearchParams,
  useNavigate,
  useOutlet,
  useSearchParams,
} from 'react-router-dom'
import { FEED_MAP } from '@constants'
import { useLocalSettings } from '@context/localSettingsStore'
import {
  RecentSalesFeed,
  SearchFeed,
  IranFeed,
  PakistanFeed,
  UkraineFeed,
  AudioFeed,
  GifFeed,
  GlbFeed,
  HtmlSvgFeed,
  ImageFeed,
  VideoFeed,
  NewObjktsFeed,
  RandomFeed,
  TagFeed,
  PdfFeed,
  MarkdownFeed,
  QuakeFeed,
  FriendsFeed,
} from './feeds'
import SubjktsSearchResults from './subjkts-search-results'

const DefaultFeedComponent = RecentSalesFeed
export const feedComponentMap = {
  [FEED_MAP['Recent Sales']]: RecentSalesFeed,
  [FEED_MAP['🏳️‍🌈 Tezospride']]: TagFeed,
  [FEED_MAP['🇮🇷 Iran']]: IranFeed,
  [FEED_MAP['Quake Aid']]: QuakeFeed,
  [FEED_MAP['🇵🇰 Pakistan']]: PakistanFeed,
  [FEED_MAP['🇺🇦 Ukraine']]: UkraineFeed,
  [FEED_MAP['Random']]: RandomFeed,
  [FEED_MAP['New OBJKTs']]: NewObjktsFeed,
  [FEED_MAP['3D']]: GlbFeed,
  [FEED_MAP['Video']]: VideoFeed,
  [FEED_MAP['Image']]: ImageFeed,
  [FEED_MAP['Audio']]: AudioFeed,
  [FEED_MAP['HTML & SVG']]: HtmlSvgFeed,
  [FEED_MAP['PDF']]: PdfFeed,
  [FEED_MAP['Markdown']]: MarkdownFeed,
  [FEED_MAP['GIF']]: GifFeed,
  [FEED_MAP['Friends']]: FriendsFeed,
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
      {isSearch && (
        <Input
          type="text"
          name="search"
          onChange={(value) => {
            setSearchTerm(value)
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

      {isSearch && searchParams.get('term') ? <SubjktsSearchResults /> : null}
      {isSearch ? (
        searchParams.get('term') ? (
          <SearchFeed />
        ) : (
          <h1>Enter a search term</h1>
        )
      ) : (
        outlet || <FeedComponent />
      )}
    </Page>
  )
}
