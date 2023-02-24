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

import { RecentSalesFeed, SearchFeed } from './feeds'
import SubjktsSearchResults from './subjkts-search-results'

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
