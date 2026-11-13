import { useState } from 'react'
import { Button } from '@atoms/button'
import { Loading } from '@atoms/loading'
import { Checkbox } from '@atoms/input'
import { useArtistsPage, useArtistExtras } from '@data/artists'
import ArtistCard, { DEFAULT_SHOW } from '@pages/artists/ArtistCard'
import useProfileCards from '@pages/artists/useProfileCards'
import useSettings from '@hooks/use-settings'
import {
  METADATA_ACCESSIBILITY_HAZARDS_PHOTOSENS,
  METADATA_CONTENT_RATING_MATURE,
} from '@constants'
import styles from '@pages/artists/index.module.scss'
import homeStyles from '@style'

/**
 * Artists tab of the search page, copied from the artists directory: same
 * cards, hazard toggles, and pager. `filters` is the raw filter state and
 * `boolExp` its toBoolExp form; mount with `key` per search to reset paging.
 */
export default function ArtistsSearchResults({ term, filters, boolExp }) {
  // Each entry is the (cursor, excluded artists) pair that produced a page;
  // the last entry is the current page. Previous just pops.
  const [history, setHistory] = useState([{ before: null, exclude: [] }])
  const current = history[history.length - 1]
  const { data, error } = useArtistsPage(
    current.before,
    current.exclude,
    term,
    boolExp
  )
  const { data: extras } = useArtistExtras(
    data?.artists.map((a) => a.address) ?? []
  )
  const { artistOf, cardOf } = useProfileCards(data?.artists)

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

  return (
    <div className={styles.page}>
      <div className={styles.toggles}>
        <div data-tour="hazards" className={homeStyles.hazard_group}>
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
      </div>

      {error && <p className={styles.empty}>Error: {error.message}</p>}
      {!data && !error && (
        <div className={styles.loading}>
          <Loading message="Loading artists" />
        </div>
      )}

      {data && !data.artists.length && (
        <div className={homeStyles.empty_section}>
          <h1>no results</h1>
        </div>
      )}

      {data && (
        <div className={styles.grid}>
          {data.artists.map((artist) => (
            <ArtistCard
              key={artist.address}
              artist={artistOf(artist)}
              extras={extras?.[artist.address]}
              show={cardOf(artist)?.show ?? DEFAULT_SHOW}
              tags={cardOf(artist)?.tags ?? []}
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
    </div>
  )
}
