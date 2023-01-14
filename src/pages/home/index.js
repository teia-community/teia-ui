// TODO (mel & xat) - best way to handle filter composition?
// import { useEffect, useState } from 'react'
import React from 'react'
import { Page, Container } from '@atoms/layout'
import {
  Routes,
  Route,
  // NavLink,
  // createSearchParams,
  // useNavigate,
  // useSearchParams,
} from 'react-router-dom'
// import { Input } from '@atoms/input'
import { useTwemoji } from '@hooks/use-twemoji'

// import SubjktsSearchResults from './subjkts-search-results'
import RecentSalesFeed from './recent-sales-feed'
import NewObjktsFeed from './new-objkts-feed'
import { PakistanFeed, IranFeed, UkraineFeed } from './fund-feeds'
import RandomFeed from './random-feed'
import {
  GlbFeed,
  MusicFeed,
  VideoFeed,
  HtmlSvgFeed,
  GifFeed,
} from './mime-type-feed'
import TagFeed from './tag-feed'
import SearchFeed from './search-feed'

// import styles from '@style'

// function FilterLink({ children, to }) {
//   return (
//     <NavLink
//       style={({ isActive }) =>
//         isActive
//           ? {
//               textDecoration: 'underline',
//             }
//           : undefined
//       }
//       className={styles.tag}
//       to={to}
//     >
//       {children}
//     </NavLink>
//   )
// }

export function Home({ isSearch = false }) {
  // const [searchParams] = useSearchParams()
  // const [searchTerm, setSearchTerm] = useState(searchParams.get('term') || '')
  // const navigate = useNavigate()

  useTwemoji()

  return (
    <Page title="Home">
      {/*
      <Container>
       <Input
          type="text"
          name="search"
          onChange={(ev) => {
            setSearchTerm(ev.target.value)
          }}
          placeholder="Search ↵"
          onKeyPress={(e) => {
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
        /> */}
      {/* <div style={{ marginTop: '15px' }}>
          <div>
            <FilterLink to="/feed/iran">🇮🇷 iran</FilterLink>
            <FilterLink to="/feed/pakistan">🇵🇰 pakistan</FilterLink>
            <FilterLink to="/feed/ukraine">🇺🇦 ukraine</FilterLink>
            <FilterLink to="/feed/tezospride">🏳️‍🌈 tezospride</FilterLink>
          </div>
          <div>
            <FilterLink to="/feed/random">random</FilterLink>
            <FilterLink to="/feed/glb">glb</FilterLink>
            <FilterLink to="/feed/music">music</FilterLink>
            <FilterLink to="/feed/video">video</FilterLink>
            <FilterLink to="/feed/html-svg">html/svg</FilterLink>
            <FilterLink to="/feed/gif">gif</FilterLink>
            <FilterLink to="/feed/newobjkts">new OBJKTs</FilterLink>
            <FilterLink to="/">recent sales</FilterLink>
          </div>
        </div>
        {isSearch ? <SubjktsSearchResults /> : null}
      </Container>
       */}
      {isSearch ? (
        <SearchFeed />
      ) : (
        <Routes>
          <Route index element={<RecentSalesFeed />} />
          <Route
            path="/tezospride"
            element={<TagFeed tag="tezospride" namespace="tezospride" />}
          />
          <Route path="/iran" element={<IranFeed />} />
          <Route path="/pakistan" element={<PakistanFeed />} />
          <Route path="/ukraine" element={<UkraineFeed />} />
          <Route path="/random" element={<RandomFeed />} />
          <Route path="/newobjkts" element={<NewObjktsFeed />} />
          <Route path="/glb" element={<GlbFeed />} />
          <Route path="/music" element={<MusicFeed />} />
          <Route path="/video" element={<VideoFeed />} />
          <Route path="/html-svg" element={<HtmlSvgFeed />} />
          <Route path="/gif" element={<GifFeed />} />
        </Routes>
      )}
    </Page>
  )
}
