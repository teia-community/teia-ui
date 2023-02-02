// TODO (mel & xat) - best way to handle filter composition?
// import { useEffect, useState } from 'react'
import React from 'react'
import { Page } from '@atoms/layout'
import {
  useOutlet,
  // NavLink,
  // createSearchParams,
  // useNavigate,
  // useSearchParams,
} from 'react-router-dom'
// import { Input } from '@atoms/input'

// import SubjktsSearchResults from './subjkts-search-results'
import { RecentSalesFeed, SearchFeed } from './feeds'

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
  const outlet = useOutlet()
  // const [searchParams] = useSearchParams()
  // const [searchTerm, setSearchTerm] = useState(searchParams.get('term') || '')
  // const navigate = useNavigate()
  return (
    <Page feed title="Home">
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
      {isSearch ? <SearchFeed /> : outlet || <RecentSalesFeed />}
    </Page>
  )
}
