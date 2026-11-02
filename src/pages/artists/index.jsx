import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Page, Container } from '@atoms/layout'
import { Button } from '@atoms/button'
import { Loading } from '@atoms/loading'
import { Checkbox, Input } from '@atoms/input'
import { useArtistsPage, useArtistExtras } from '@data/artists'
import { useChainProfiles } from '@data/profiles'
import { REGISTRIES_ENABLED } from '@data/registries'
import { useUserStore } from '@context/userStore'
import ArtistCard, { FILETYPES, DEFAULT_SHOW, readDraft } from './ArtistCard'
import useSettings from '@hooks/use-settings'
import {
  METADATA_ACCESSIBILITY_HAZARDS_PHOTOSENS,
  METADATA_CONTENT_RATING_MATURE,
} from '@constants'
import Tour, { TourLink } from '@components/tour'
import styles from './index.module.scss'

const HINT_PX = 40 // full height of the scroll-for-next-page bar

export const YEARS = Array.from(
  { length: new Date().getFullYear() - 2021 + 1 },
  (_, i) => 2021 + i
)
export const LICENSES = [
  { label: 'None', value: 'none' },
  { label: 'CC BY', value: 'cc-by-4.0' },
  { label: 'CC BY-NC', value: 'cc-by-nc-4.0' },
  { label: 'CC BY-SA', value: 'cc-by-sa-4.0' },
]
export const MARKETS = ['All', 'Primary', 'Secondary']
export const EMPTY_FILTERS = {
  types: [],
  years: [],
  licenses: [],
  market: 'All',
  tag: '',
}

// Filter state -> Hasura tokens_bool_exp. Primary/secondary only narrows to
// "has an active listing" here; the seller split happens client-side.
export function toBoolExp(f) {
  const and = []
  if (f.types.length)
    and.push({ mime_type: { _in: f.types.flatMap((t) => t.mimes) } })
  if (f.years.length)
    and.push({
      _or: f.years.map((y) => ({
        minted_at: { _gte: `${y}-01-01`, _lt: `${y + 1}-01-01` },
      })),
    })
  if (f.licenses.length) and.push({ rights: { _in: f.licenses } })
  if (f.market !== 'All') and.push({ listings: { status: { _eq: 'active' } } })
  if (f.tag) and.push({ tags: { tag: { _ilike: `%${f.tag}%` } } })
  return and.length ? { _and: and } : {}
}

const DIRECTORY_TOUR = [
  { target: 'search', text: 'Search artists by name.' },
  {
    target: 'filters',
    text: 'Narrow by year, license, market, file type and more.',
  },
  {
    target: 'card',
    text: 'Each card shows an artist and their latest creations.',
  },
  {
    target: 'media',
    text: 'Items tagged GIF, VIDEO or AUDIO preview on hover.',
  },
]

const CUSTOMIZE_TOUR = [
  {
    target: 'customize',
    text: 'Click "Customize my card" to choose what shows on your card.',
    next: false,
    align: 'right',
  },
]

export const toggleIn = (list, item) =>
  list.includes(item) ? list.filter((x) => x !== item) : [...list, item]

export function Chips({ options, selected, onToggle, labelOf = (o) => o }) {
  return (
    <div className={styles.chips}>
      {options.map((o) => (
        <button
          key={labelOf(o)}
          type="button"
          className={selected.includes(o) ? styles.chip_active : styles.chip}
          onClick={() => onToggle(o)}
        >
          {labelOf(o)}
        </button>
      ))}
    </div>
  )
}

/** Filetype / year / license / market / tag filters (see toBoolExp). */
export function FiltersPanel({ filters, setFilters }) {
  const setF = (key, value) => setFilters((f) => ({ ...f, [key]: value }))
  return (
    <div className={styles.filters}>
      <div className={styles.filter_row}>
        <span className={styles.filter_label}>Filetype</span>
        <Chips
          options={FILETYPES}
          selected={filters.types}
          labelOf={(t) => t.label}
          onToggle={(t) => setF('types', toggleIn(filters.types, t))}
        />
      </div>
      <div className={styles.filter_row}>
        <span className={styles.filter_label}>Year</span>
        <Chips
          options={YEARS}
          selected={filters.years}
          labelOf={String}
          onToggle={(y) => setF('years', toggleIn(filters.years, y))}
        />
      </div>
      <div className={styles.filter_row}>
        <span className={styles.filter_label}>License</span>
        <Chips
          options={LICENSES.map((l) => l.value)}
          selected={filters.licenses}
          labelOf={(v) => LICENSES.find((l) => l.value === v).label}
          onToggle={(v) => setF('licenses', toggleIn(filters.licenses, v))}
        />
      </div>
      <div className={styles.filter_row}>
        <span className={styles.filter_label}>Market</span>
        <Chips
          options={MARKETS}
          selected={[filters.market]}
          onToggle={(m) => setF('market', m)}
        />
      </div>
      <div className={styles.filter_row}>
        <span className={styles.filter_label}>Tag</span>
        <input
          className={styles.tag_input}
          value={filters.tag}
          onChange={(e) => setF('tag', e.target.value.replace(/^#/, ''))}
          placeholder="e.g. glitch"
        />
      </div>
    </div>
  )
}

export default function ArtistsPage() {
  // Each entry is the (cursor, excluded artists) pair that produced a page;
  // the last entry is the current page. Previous just pops.
  const [history, setHistory] = useState([{ before: null, exclude: [] }])
  const current = history[history.length - 1]
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const touring = useSearchParams()[0].get('tour') === 'customize'
  const [showFilters, setShowFilters] = useState(false)
  const [applied, setApplied] = useState({ search: '', filters: {} })
  useEffect(() => {
    const t = setTimeout(() => {
      setApplied({ search: search.trim(), filters: toBoolExp(filters) })
      setHistory([{ before: null, exclude: [] }])
    }, 300)
    return () => clearTimeout(t)
  }, [search, filters])
  const { data, error } = useArtistsPage(
    current.before,
    current.exclude,
    applied.search,
    applied.filters
  )
  const { data: extras } = useArtistExtras(
    data?.artists.map((a) => a.address) ?? []
  )
  // On-chain card config (shadownet test mode) wins over SUBJKT metadata.
  const { data: profiles } = useChainProfiles(
    REGISTRIES_ENABLED ? data?.artists.map((a) => a.address) ?? [] : []
  )
  const cardOf = (artist) =>
    profiles?.[artist.address]?.content?.card ?? artist.card
  const address = useUserStore((st) => st.address)
  const activeCount =
    filters.types.length +
    filters.years.length +
    filters.licenses.length +
    (filters.market !== 'All') +
    (filters.tag ? 1 : 0)

  // Primary/secondary split needs a column compare Hasura can't do server-side.
  const marketFilter = (token) => {
    if (filters.market === 'All') return true
    const own = token.listings.some((l) => l.seller_address === token.artist)
    return filters.market === 'Primary' ? own : token.listings.length && !own
  }
  const page = history.length - 1

  const [showPhotosensitive, setShowPhotosensitive] = useState(false)
  const [showNsfw, setShowNsfw] = useState(false)
  const { photosensitiveMap, nsfwMap } = useSettings()
  const hazardFilters = [
    {
      label: 'Photosensitive',
      active: !showPhotosensitive,
      hide: (token) =>
        photosensitiveMap.get(token.token_id) === 1 ||
        token.teia_meta?.accessibility?.hazards?.includes(
          METADATA_ACCESSIBILITY_HAZARDS_PHOTOSENS
        ),
    },
    {
      label: 'NSFW',
      active: !showNsfw,
      hide: (token) =>
        nsfwMap.get(token.token_id) === 1 ||
        token.teia_meta?.content_rating === METADATA_CONTENT_RATING_MATURE,
    },
  ]

  const nextPage = () => {
    setHistory((h) => [
      ...h,
      {
        before: data.cursor,
        exclude: [...current.exclude, ...data.artists.map((a) => a.address)],
      },
    ])
    window.scrollTo(0, 0)
  }
  const prevPage = () => {
    setHistory((h) => h.slice(0, -1))
    window.scrollTo(0, 0)
  }

  // At the bottom, scrolling down slides a hint bar in proportionally;
  // once it is fully extended, advance to the next page.
  const [pull, setPull] = useState(0) // 0..1
  const pullRef = useRef(0)
  const nextRef = useRef(nextPage)
  nextRef.current = nextPage
  const hasMore = data?.hasMore
  useEffect(() => {
    if (!hasMore) return
    // Total wheel travel needed, and a per-tick cap so smooth-scroll momentum
    // (one huge delta) can't fill the bar in a single event.
    const PULL_PX = 900
    const TICK_MAX = 120
    // Tolerance covers the hint bar's own height as it expands.
    const atBottom = () =>
      window.innerHeight + window.scrollY >=
      document.documentElement.scrollHeight - HINT_PX - 2
    const update = (v) => {
      pullRef.current = v
      setPull(v)
    }
    const onWheel = (e) => {
      if (!atBottom() || e.deltaY <= 0) return update(0)
      const next = Math.min(
        1,
        pullRef.current + Math.min(e.deltaY, TICK_MAX) / PULL_PX
      )
      update(next === 1 ? 0 : next)
      if (next === 1) nextRef.current()
    }
    window.addEventListener('wheel', onWheel, { passive: true })
    return () => window.removeEventListener('wheel', onWheel)
  }, [hasMore])

  return (
    <Page title="Artists">
      <Tour name="directory" steps={DIRECTORY_TOUR} />
      <Tour name="customize" steps={CUSTOMIZE_TOUR} />
      <Container>
        <div className={styles.page}>
          <div className={styles.header_row}>
            <div>
              <h1 className={styles.heading}>Artists</h1>
              <p className={styles.subheading}>
                Artists by most recent mint, with their latest creations.
              </p>
            </div>
            {/* TODO: link to the connected wallet's subjkt once the on-chain save exists */}
            <div className={styles.header_actions}>
              <span data-tour="customize">
                <Button
                  shadow_box
                  small
                  to={`/artist-directory/configure/${
                    (REGISTRIES_ENABLED && address) || 'malicioussheep'
                  }${touring ? '?tour=customize' : ''}`}
                >
                  Customize my card
                </Button>
              </span>
              <TourLink name="customize" title="How to customize your card" />
            </div>
          </div>

          <div data-tour="search">
            <Input
              className={styles.search}
              name="artist-search"
              value={search}
              onChange={setSearch}
              placeholder="Search artists by name"
              label="Search"
            >
              <div className={styles.search_actions}>
                {activeCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setFilters(EMPTY_FILTERS)}
                  >
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
                <TourLink name="directory" />
              </div>
            </Input>
          </div>
          {showFilters && (
            <FiltersPanel filters={filters} setFilters={setFilters} />
          )}
          <div className={styles.toggles}>
            <Checkbox
              checked={showPhotosensitive}
              onCheck={setShowPhotosensitive}
              label="Show photosensitive creations"
            />
            <Checkbox
              checked={showNsfw}
              onCheck={setShowNsfw}
              label="Show NSFW creations"
            />
          </div>

          {error && <p className={styles.empty}>Error: {error.message}</p>}
          {!data && !error && (
            <div className={styles.loading}>
              <Loading message="Loading artists" />
            </div>
          )}

          {data && (
            <div className={styles.grid}>
              {data.artists.map((artist) => (
                <ArtistCard
                  key={artist.address}
                  artist={artist}
                  extras={extras?.[artist.address]}
                  show={
                    readDraft(artist.address)?.show ??
                    cardOf(artist)?.show ??
                    DEFAULT_SHOW
                  }
                  tags={
                    readDraft(artist.address)?.tags ??
                    cardOf(artist)?.tags ??
                    []
                  }
                  hazardFilters={hazardFilters}
                  marketFilter={marketFilter}
                />
              ))}
            </div>
          )}

          {data && (page > 0 || data.hasMore) && (
            <div className={styles.pager}>
              <Button small disabled={page === 0} onClick={prevPage}>
                Previous
              </Button>
              <span className={styles.pageInfo}>Page {page + 1}</span>
              <Button small disabled={!data.hasMore} onClick={nextPage}>
                Next
              </Button>
            </div>
          )}
          <div
            className={styles.hint}
            style={{ height: pull > 0 ? HINT_PX : 0 }}
          >
            <div
              className={styles.hint_progress}
              style={{ width: `${pull * 100}%` }}
            />
            <span>Scroll for next page</span>
          </div>
        </div>
      </Container>
    </Page>
  )
}
