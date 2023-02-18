// TODO (mel & xat) - best way to handle filter composition?
// import { useEffect, useState } from 'react'
import { Input } from '@atoms/input'
import { Page } from '@atoms/layout'
import { useState } from 'react'
import {
  createSearchParams,
  useNavigate,
  useOutlet,
  useSearchParams,
  // NavLink,
  // createSearchParams,
  // useNavigate,
  // useSearchParams,
} from 'react-router-dom'
// import { Input } from '@atoms/input'

// import SubjktsSearchResults from './subjkts-search-results'
import { RecentSalesFeed, SearchFeed } from './feeds'
import SubjktsSearchResults from './subjkts-search-results'

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
  const [searchParams] = useSearchParams()
  const [searchTerm, setSearchTerm] = useState(searchParams.get('term') || '')
  const navigate = useNavigate()

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
      </Container>
      */}
      {isSearch && searchParams.get('term') ? <SubjktsSearchResults /> : null}
      {isSearch ? (
        searchParams.get('term') ? (
          <SearchFeed />
        ) : (
          <h1>Enter a search term</h1>
        )
      ) : (
        outlet || <RecentSalesFeed />
      )}
    </Page>
  )
}
