import React, { useState } from 'react'
import { Page, Container, Padding } from '@components/layout'
import {
  Routes,
  Route,
  NavLink,
  createSearchParams,
  useNavigate,
  useSearchParams,
} from 'react-router-dom'
import { Input } from '@components/input'

import SubjktsSearchResults from './SubjktsSearchResults'
import RecentSalesFeed from './RecentSalesFeed'
import NewObjktsFeed from './NewObjktsFeed'
import UkraineFeed from './UkraineFeed'
import RandomFeed from './RandomFeed'
import {
  GlbFeed,
  MusicFeed,
  VideoFeed,
  HtmlSvgFeed,
  GifFeed,
} from './MimeTypeFeed'
import { TopSales1DFeed, TopSales1WFeed, TopSales1MFeed } from './TopSalesFeed'
import SearchFeed from './SearchFeed'

import './style.css'
import { IconCache } from '@utils/with-icon'

function FilterLink({ children, to }) {
  return (
    <NavLink
      style={({ isActive }) =>
        isActive
          ? {
              textDecoration: 'underline',
            }
          : undefined
      }
      className="tag"
      to={to}
    >
      {children}
    </NavLink>
  )
}

export function Search() {
  const [searchParams] = useSearchParams()
  const [searchTerm, setSearchTerm] = useState(searchParams.get('term') || '')
  const navigate = useNavigate()

  return (
    <Page>
      <IconCache.Provider value={{}}>
        <Container>
          <Padding>
            <Input
              type="text"
              name="search"
              onChange={(ev) => {
                setSearchTerm(ev.target.value)
              }}
              label="Search ↵"
              placeholder="Search ↵"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  navigate(
                    {
                      pathname: 'search',
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
            <div style={{ marginTop: '15px' }}>
              <FilterLink to="/ukraine">🇺🇦 ukraine</FilterLink>
              <FilterLink to="/random">random</FilterLink>
              <FilterLink to="/glb">glb</FilterLink>
              <FilterLink to="/music">music</FilterLink>
              <FilterLink to="/video">video</FilterLink>
              <FilterLink to="/html-svg">html/svg</FilterLink>
              <FilterLink to="/gif">gif</FilterLink>
              <FilterLink to="/newobjkts">new OBJKTs</FilterLink>
              <FilterLink to="/">recent sales</FilterLink>
              <FilterLink to="/1D">1D</FilterLink>
              <FilterLink to="/1W">1W</FilterLink>
              <FilterLink to="/1M">1M</FilterLink>
            </div>
            <Routes>
              <Route path="/search" element={<SubjktsSearchResults />} />
            </Routes>
          </Padding>
        </Container>
        <Container xlarge>
          <Routes>
            <Route path="/">
              <Route index element={<RecentSalesFeed />} />
              <Route path="ukraine" element={<UkraineFeed />} />
              <Route path="random" element={<RandomFeed />} />
              <Route path="newobjkts" element={<NewObjktsFeed />} />
              <Route path="glb" element={<GlbFeed />} />
              <Route path="music" element={<MusicFeed />} />
              <Route path="video" element={<VideoFeed />} />
              <Route path="html-svg" element={<HtmlSvgFeed />} />
              <Route path="gif" element={<GifFeed />} />
              <Route path="1D" element={<TopSales1DFeed />} />
              <Route path="1W" element={<TopSales1WFeed />} />
              <Route path="1M" element={<TopSales1MFeed />} />
              <Route path="search" element={<SearchFeed />} />
            </Route>
          </Routes>
        </Container>
      </IconCache.Provider>
    </Page>
  )
}
