import { useEffect, useState } from 'react'
import {
  createSearchParams,
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom'
import { Input } from '@atoms/input'
import { Tabs } from '@atoms/tab'
import Tour, { TourLink } from '@components/tour'
import { useEvents } from '@hooks/use-events'
import {
  filterEvents,
  useArtistCount,
  useObjktCount,
  useUserSearch,
} from '@data/search'
import { EMPTY_FILTERS, FiltersPanel, toBoolExp } from '@pages/artists'
import artistStyles from '@pages/artists/index.module.scss'
import styles from '@style'
import * as FEEDS from './feeds'
import UserSearchResults from './user-search-results'
import ArtistsSearchResults from './artists-search-results'
import EventsSearchResults from './events-search-results'

const SEARCH_TOUR = [
  { target: 'search', text: 'Type a search term and press Enter.' },
  {
    target: 'filters',
    text: 'Narrow OBJKTs and artists by file type, year, license, market or tag.',
  },
  {
    target: 'tabs',
    text: 'Results are split into categories. Each tab shows how many matched; switch tabs to browse them.',
  },
  {
    target: 'hazards',
    text: 'Photosensitive and NSFW creations are hidden unless you opt in here.',
  },
]

const withCount = (label, count) =>
  count === undefined ? label : `${label} (${count.toLocaleString()})`

/**
 * /search/:tab?term=… — one tab per result category, each labelled with its
 * count. Counts are cheap queries; only the active tab's results mount.
 * The artists-page filters apply to the token-backed tabs (OBJKTs, Artists).
 */
export default function Search() {
  const [searchParams] = useSearchParams()
  const term = searchParams.get('term') || ''
  const [searchTerm, setSearchTerm] = useState(term)
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const tab = useParams()['*'] || ''

  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const [boolExp, setBoolExp] = useState({})
  const [showFilters, setShowFilters] = useState(false)
  // Debounced like the artists page, so typing a tag doesn't refetch per key.
  useEffect(() => {
    const t = setTimeout(() => setBoolExp(toBoolExp(filters)), 300)
    return () => clearTimeout(t)
  }, [filters])
  const activeCount =
    filters.types.length +
    filters.years.length +
    filters.licenses.length +
    (filters.market !== 'All') +
    (filters.tag ? 1 : 0)

  const objktCount = useObjktCount(term, boolExp)
  const artistCount = useArtistCount(term, boolExp)
  const { users, isLagging } = useUserSearch(term)
  const { events, isLoading: eventsLoading } = useEvents()
  const eventCount =
    term && !eventsLoading ? filterEvents(events, term).length : undefined

  const search = term ? `?${createSearchParams({ term })}` : ''
  const tabs = [
    { path: '', label: 'OBJKTs', count: objktCount },
    { path: 'artists', label: 'Artists', count: artistCount },
    {
      path: 'users',
      label: 'Users',
      count: isLagging ? undefined : users?.length,
    },
    { path: 'events', label: 'Events', count: eventCount },
  ].map(({ path, label, count }) => ({
    title: withCount(label, count),
    to: { pathname: path ? `/search/${path}` : '/search', search },
    disabled: count === 0,
  }))

  return (
    <>
      <Tour name="search" steps={SEARCH_TOUR} />
      <div data-tour="search" className={styles.search_input}>
        <Input
          className={artistStyles.search}
          type="text"
          name="Enter a search term and press enter:"
          label="Search"
          onChange={(value) => {
            setSearchTerm(value)
          }}
          placeholder="Search ↵"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              navigate(
                {
                  pathname,
                  search: createSearchParams({
                    term: searchTerm,
                  }).toString(),
                },
                { replace: true }
              )
            }
          }}
          value={searchTerm}
        >
          <div className={artistStyles.search_actions}>
            {activeCount > 0 && (
              <button type="button" onClick={() => setFilters(EMPTY_FILTERS)}>
                Clear
              </button>
            )}
            <button
              type="button"
              data-tour="filters"
              onClick={() => setShowFilters((v) => !v)}
            >
              {showFilters ? '▴' : '▾'} Filters
              {activeCount ? ` (${activeCount})` : ''}
            </button>
            <TourLink name="search" title="How search works" />
          </div>
        </Input>
      </div>
      {showFilters && (
        <FiltersPanel filters={filters} setFilters={setFilters} />
      )}

      {term && (
        <>
          <div className={styles.search_tabs}>
            <Tabs tabs={tabs} tourTarget="tabs" />
          </div>
          {tab === '' && <FEEDS.SearchFeed filters={boolExp} />}
          {tab === 'artists' && (
            <ArtistsSearchResults
              key={`${term}:${JSON.stringify(boolExp)}`}
              term={term}
              filters={filters}
              boolExp={boolExp}
            />
          )}
          {tab === 'users' && <UserSearchResults />}
          {tab === 'events' && <EventsSearchResults term={term} />}
        </>
      )}
    </>
  )
}
