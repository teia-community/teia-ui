// ! NOTE - Keep the comments.
import { Fragment, useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import styles from '@style'
import { DropDown, DropdownButton } from '@atoms/dropdown'
import { IconToggle } from '@atoms/toggles'
import { SingleViewIcon, MasonryIcon, ChevronIcon } from '@icons'

import { Button } from '@atoms/button'

import { useLocalSettings } from '@context/localSettingsStore'
import { useLocation, useNavigate } from 'react-router'
import { Line } from '@atoms/line'
import { Checkbox, Input } from '@atoms/input'
import { shallow } from 'zustand/shallow'
import { useUserStore } from '@context/userStore'
import { DEFAULT_START_FEED } from '@constants'
import { Chips, EMPTY_FILTERS, YEARS, toggleIn } from '@pages/artists'
import { FILETYPES } from '@pages/artists/ArtistCard'
import artistStyles from '@pages/artists/index.module.scss'

// const MediaFilter = ({ label, tagline }) => {
//   return (
//     <div className={styles.media_type}>
//       <Toggle box label={label} />
//       <p className={styles.tagline}>{tagline}</p>
//     </div>
//   )
// }

// Shown as horizontal tabs instead of inside the dropdown.
const sortFeedMap = new Map([
  ['/feed/sales', 'Recent Sales'],
  ['/feed/random', 'Random'],
  ['/feed/newobjkts', 'New OBJKTs'],
  ['/feed/friends', 'Friends'],
])

const locationMap = new Map([
  ['---fund_feeds', 'Event Feeds'],
  ['/feed/art4artists', 'Art4Artists'],
  ['/feed/tez4pal', '🇵🇸 Tez4Pal'],
  ['/feed/morocco-quake-aid', '🇲🇦 Quake Aid'],
  ['/feed/quake-aid', '🇹🇷🇸🇾 Quake Aid'],
  ['/feed/ukraine', '🇺🇦 Ukraine'],
  ['/feed/pakistan', '🇵🇰 Pakistan'],
  ['/feed/iran', '🇮🇷 Iran'],
  ['/feed/tezospride', '🏳️‍🌈 Tezospride'],
])

const locationNeedSync = ['/feed/friends']

const DICE_PIPS = {
  1: [[12, 12]],
  2: [
    [8, 8],
    [16, 16],
  ],
  3: [
    [7, 7],
    [12, 12],
    [17, 17],
  ],
  4: [
    [8, 8],
    [16, 8],
    [8, 16],
    [16, 16],
  ],
  5: [
    [7, 7],
    [17, 7],
    [12, 12],
    [7, 17],
    [17, 17],
  ],
  6: [
    [8, 7],
    [16, 7],
    [8, 12],
    [16, 12],
    [8, 17],
    [16, 17],
  ],
}

// Which cube side each face sits on, and the cube rotation that brings it front.
const DICE_FACES = {
  1: { place: 'rotateY(0deg)', x: 0, y: 0 },
  6: { place: 'rotateY(180deg)', x: 0, y: 180 },
  3: { place: 'rotateY(90deg)', x: 0, y: -90 },
  4: { place: 'rotateY(-90deg)', x: 0, y: 90 },
  5: { place: 'rotateX(90deg)', x: -90, y: 0 },
  2: { place: 'rotateX(-90deg)', x: 90, y: 0 },
}

const Dice3D = ({ face, spins }) => {
  const { x, y } = DICE_FACES[face]
  return (
    <span className={styles.dice_scene} aria-hidden>
      <span
        className={styles.dice_cube}
        style={{
          transform: `rotateX(-25deg) rotateY(-35deg) rotateX(${
            x + spins * 720
          }deg) rotateY(${y + spins * 360}deg)`,
        }}
      >
        {Object.entries(DICE_FACES).map(([n, { place }]) => (
          <svg
            key={n}
            viewBox="0 0 24 24"
            className={styles.dice_face}
            style={{ transform: `${place} translateZ(var(--dice-half))` }}
          >
            {DICE_PIPS[n].map(([cx, cy]) => (
              <circle
                key={`${cx}-${cy}`}
                cx={cx}
                cy={cy}
                r="2.2"
                fill="currentColor"
              />
            ))}
          </svg>
        ))}
      </span>
    </span>
  )
}

const ROLL_MS = 700

/** Random feed tab: tumbles, then reloads the feed with a fresh roll. */
const RandomDice = ({ selected }) => {
  const navigate = useNavigate()
  const location = useLocation()
  // Face lives in location state so it survives the toolbar remounting.
  const [face, setFace] = useState(location.state?.diceFace || 5)
  const [spins, setSpins] = useState(0)
  const [rolling, setRolling] = useState(false)

  return (
    <Button
      alt="roll random feed"
      onClick={() => {
        if (rolling) return
        const next = Math.ceil(Math.random() * 6)
        setRolling(true)
        setFace(next)
        setSpins((n) => n + 1)
        setTimeout(() => {
          setRolling(false)
          // `roll` in the URL survives the feed's own scroll param updates.
          navigate(
            { pathname: '/feed/random', search: `?roll=${Date.now()}` },
            { state: { diceFace: next } }
          )
        }, ROLL_MS)
      }}
    >
      <span className={styles.dice_label}>
        <Dice3D face={face} spins={spins} />
        <span className={selected ? styles.sort_selected : undefined}>
          Random
        </span>
      </span>
    </Button>
  )
}

// Recent Sales tab: spinning coins drop through a square icon beside the label.
const COINS = [
  { left: '30%', delay: 0 },
  { left: '70%', delay: 470 },
  { left: '50%', delay: 930 },
]

// Theme colours only: outline in the text colour, face in the page background.
const Coin = () => (
  <svg viewBox="0 0 12 12" className={styles.coin_face}>
    <circle
      cx="6"
      cy="6"
      r="5.2"
      fill="var(--background-color)"
      stroke="currentColor"
      strokeWidth="1"
    />
    <text
      x="6"
      y="6.4"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize="7"
      fill="currentColor"
    >
      ꜩ
    </text>
  </svg>
)

const SalesTab = ({ selected, onClick }) => (
  <Button onClick={onClick}>
    <span className={styles.icon_label}>
      <span className={styles.coins_box} aria-hidden>
        {COINS.map(({ left, delay }) => (
          <span
            key={left}
            className={styles.coin}
            style={{ left, animationDelay: `${delay}ms` }}
          >
            <Coin />
          </span>
        ))}
      </span>
      <span className={selected ? styles.sort_selected : undefined}>
        Recent Sales
      </span>
    </span>
  </Button>
)

// New OBJKTs tab: an orb that keeps morphing between shapes. Every shape is
// sampled to the same point count, starting top-centre and going clockwise, so
// the path strings interpolate point-for-point.
const ORB_POINTS = 60
const MORPH_MS = 700

function samplePolygon(verts) {
  const edges = verts.map((a, i) => {
    const b = verts[(i + 1) % verts.length]
    return { a, b, len: Math.hypot(b[0] - a[0], b[1] - a[1]) }
  })
  const total = edges.reduce((sum, e) => sum + e.len, 0)
  const pts = []
  for (let i = 0; i < ORB_POINTS; i++) {
    let d = (i * total) / ORB_POINTS
    const e = edges.find((edge) => {
      if (d <= edge.len) return true
      d -= edge.len
      return false
    })
    const t = d / e.len
    pts.push([e.a[0] + (e.b[0] - e.a[0]) * t, e.a[1] + (e.b[1] - e.a[1]) * t])
  }
  return pts
}

const toPath = (pts) =>
  `M${pts.map(([x, y]) => `${x.toFixed(2)} ${y.toFixed(2)}`).join(' L')} Z`

const ORB_SHAPES = {
  sphere: toPath(
    Array.from({ length: ORB_POINTS }, (_, i) => {
      const a = -Math.PI / 2 + (2 * Math.PI * i) / ORB_POINTS
      return [12 + 8 * Math.cos(a), 12 + 8 * Math.sin(a)]
    })
  ),
  cube: toPath(
    samplePolygon([
      [12, 4],
      [20, 4],
      [20, 20],
      [4, 20],
      [4, 4],
    ])
  ),
  triangle: toPath(
    samplePolygon([
      [12, 3],
      [21, 20],
      [3, 20],
    ])
  ),
  polygon: toPath(
    samplePolygon([
      [12, 3],
      [20, 7.5],
      [20, 16.5],
      [12, 21],
      [4, 16.5],
      [4, 7.5],
    ])
  ),
  trapezoid: toPath(
    samplePolygon([
      [12, 6],
      [17, 6],
      [21, 19],
      [3, 19],
      [7, 6],
    ])
  ),
  diamond: toPath(
    samplePolygon([
      [12, 3],
      [19, 12],
      [12, 21],
      [5, 12],
    ])
  ),
  pentagon: toPath(
    samplePolygon([
      [12.0, 3.5],
      [20.08, 9.37],
      [17.0, 18.88],
      [7.0, 18.88],
      [3.92, 9.37],
    ])
  ),
  octagon: toPath(
    samplePolygon([
      [12.0, 3.5],
      [18.01, 5.99],
      [20.5, 12.0],
      [18.01, 18.01],
      [12.0, 20.5],
      [5.99, 18.01],
      [3.5, 12.0],
      [5.99, 5.99],
    ])
  ),
  star: toPath(
    samplePolygon([
      [12.0, 3.0],
      [14.23, 8.93],
      [20.56, 9.22],
      [15.61, 13.17],
      [17.29, 19.28],
      [12.0, 15.8],
      [6.71, 19.28],
      [8.39, 13.17],
      [3.44, 9.22],
      [9.77, 8.93],
    ])
  ),
  parallelogram: toPath(
    samplePolygon([
      [14, 6],
      [21, 6],
      [17, 18],
      [3, 18],
      [7, 6],
    ])
  ),
}

const SHAPE_NAMES = Object.keys(ORB_SHAPES)

const NewObjktsTab = ({ selected, onClick }) => {
  const [shape, setShape] = useState('sphere')
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    if (reduceMotion) return
    const id = setInterval(() => {
      setShape((cur) => {
        const pool = SHAPE_NAMES.filter((s) => s !== cur)
        return pool[Math.floor(Math.random() * pool.length)]
      })
    }, MORPH_MS)
    return () => clearInterval(id)
  }, [reduceMotion])

  return (
    <Button onClick={onClick}>
      <span className={styles.icon_label}>
        <svg viewBox="0 0 24 24" className={styles.tab_icon} aria-hidden>
          <motion.path
            initial={false}
            animate={{ d: ORB_SHAPES[shape] }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>
        <span className={selected ? styles.sort_selected : undefined}>
          New OBJKTs
        </span>
      </span>
    </Button>
  )
}

// Friends tab: classic group icon — one outlined profile in front, two behind
// it. The front figure is filled with the page background so it hides the
// overlap of the ones behind.
const FriendsIcon = () => (
  <svg
    viewBox="-2 -2 28 28"
    className={styles.tab_icon}
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    aria-hidden
  >
    <circle cx="5.5" cy="9" r="2.3" />
    <path d="M1 18.5 a4.5 4.5 0 0 1 9 0" />
    <circle cx="18.5" cy="9" r="2.3" />
    <path d="M14 18.5 a4.5 4.5 0 0 1 9 0" />
    <g fill="var(--background-color)">
      <circle cx="12" cy="8" r="3" />
      <path d="M6 20.5 a6 6 0 0 1 12 0 Z" />
    </g>
  </svg>
)

const FeedSearch = ({ filters, setFilters }) => {
  const [term, setTerm] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const navigate = useNavigate()
  const submit = () => {
    if (term.trim()) navigate(`/search?term=${encodeURIComponent(term.trim())}`)
  }
  const activeCount = filters.types.length + filters.years.length
  const toggle = (key, value) =>
    setFilters((f) => ({ ...f, [key]: toggleIn(f[key], value) }))

  return (
    <div className={styles.search_area}>
      <Input
        className={styles.search}
        name="feed-search"
        value={term}
        onChange={setTerm}
        onKeyDown={(e) => e.key === 'Enter' && submit()}
        placeholder="Search OBJKTs, artists, tags"
        label="Search"
      >
        <div className={styles.search_actions}>
          {activeCount > 0 && (
            <button type="button" onClick={() => setFilters(EMPTY_FILTERS)}>
              Clear
            </button>
          )}
          <button type="button" onClick={() => setShowFilters((v) => !v)}>
            {showFilters ? '▴' : '▾'} Filters
            {activeCount ? ` (${activeCount})` : ''}
          </button>
          <button type="button" onClick={submit}>
            Search
          </button>
        </div>
      </Input>
      {showFilters && (
        <div className={styles.filters_area}>
          {/* Filetype and year only; the artist directory has the full set. */}
          <div className={artistStyles.filters}>
            <div className={artistStyles.filter_row}>
              <span className={artistStyles.filter_label}>Filetype</span>
              <Chips
                options={FILETYPES}
                selected={filters.types}
                labelOf={(t) => t.label}
                onToggle={(t) => toggle('types', t)}
              />
            </div>
            <div className={artistStyles.filter_row}>
              <span className={artistStyles.filter_label}>Year</span>
              <Chips
                options={YEARS}
                selected={filters.years}
                labelOf={String}
                onToggle={(y) => toggle('years', y)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export const FeedToolbar = ({ feeds_menu = false, hazards, filters }) => {
  // const [price, setPrice] = useState({ from: 0, to: 0 })

  const [viewMode, setViewMode, startFeed] = useLocalSettings(
    (st) => [st.viewMode, st.setViewMode, st.startFeed],
    shallow
  )
  const location = useLocation()
  const path = '/' + location.pathname.split('/').slice(1, 3).join('/')
  const currentLabel =
    locationMap.get(path) ||
    sortFeedMap.get(path) ||
    startFeed ||
    DEFAULT_START_FEED
  const isSortFeed = [...sortFeedMap.values()].includes(currentLabel)
  const feedLabel = isSortFeed ? 'More Feeds' : currentLabel
  const navigate = useNavigate()
  const walletAddress = useUserStore((st) => [st.address], shallow)

  // TODO: finish the filtering logic
  // const filters = false
  return (
    <motion.div className={styles.toolbar}>
      {feeds_menu && (
        <div className={styles.sort_area}>
          {[...sortFeedMap.entries()].map(([k, label]) => {
            const selected = currentLabel === label
            if (k === '/feed/random') {
              return <RandomDice key={k} selected={selected} />
            }
            if (k === '/feed/sales') {
              return (
                <SalesTab
                  key={k}
                  selected={selected}
                  onClick={() => navigate(k)}
                />
              )
            }
            if (k === '/feed/newobjkts') {
              return (
                <NewObjktsTab
                  key={k}
                  selected={selected}
                  onClick={() => navigate(k)}
                />
              )
            }
            if (locationNeedSync.includes(k)) {
              return (
                <Button
                  key={k}
                  onClick={() => {
                    navigate('/sync', { state: `${k}` })
                  }}
                >
                  <span className={styles.icon_label}>
                    <FriendsIcon />
                    <span
                      className={selected ? styles.sort_selected : undefined}
                    >
                      {label}
                    </span>
                  </span>
                </Button>
              )
            }
            return (
              <Button
                key={k}
                className={selected ? styles.sort_selected : undefined}
                onClick={() => navigate(k)}
              >
                {label}
              </Button>
            )
          })}
          <DropdownButton
            alt="feeds selection dropdown"
            menuID="feeds"
            icon={<ChevronIcon />}
            label={feedLabel}
            className={styles.feeds_dropdown}
          >
            <DropDown menuID="feeds">
              <div className={styles.feeds_button}>
                {[...locationMap.keys()].map((k) => {
                  if (k.startsWith('-')) {
                    return (
                      <Fragment key={k}>
                        <Line className={styles.separator} />
                        <span className={styles.subtitle}>
                          {locationMap.get(k)}
                        </span>
                      </Fragment>
                    )
                  }
                  if (locationNeedSync.includes(k)) {
                    return (
                      <Button
                        key={k}
                        onClick={() => {
                          navigate('/sync', { state: `${k}` })
                        }}
                      >
                        {locationMap.get(k)}
                      </Button>
                    )
                  }
                  return (
                    <Button key={k} to={k}>
                      {locationMap.get(k)}
                    </Button>
                  )
                })}
              </div>
            </DropDown>
          </DropdownButton>
        </div>
      )}
      <div className={styles.view_mode_area} data-tour="view-mode">
        <IconToggle
          alt={'single view mode'}
          toggled={viewMode === 'single'}
          onClick={() => {
            setViewMode('single')
          }}
          icon={<SingleViewIcon />}
        />
        <IconToggle
          alt={'masonry view mode'}
          toggled={viewMode === 'masonry'}
          onClick={() => setViewMode('masonry')}
          icon={<MasonryIcon />}
        />
      </div>
      {feeds_menu && filters && <FeedSearch {...filters} />}
      {feeds_menu && hazards && (
        <div className={styles.toggles_area}>
          <Checkbox
            checked={hazards.showPhotosensitive}
            onCheck={hazards.setShowPhotosensitive}
            label="Show photosensitive creations"
          />
          <Checkbox
            checked={hazards.showNsfw}
            onCheck={hazards.setShowNsfw}
            label="Show NSFW creations"
          />
        </div>
      )}
      {/* KEEP */}
      {/* {filters && (
        <DropdownButton
          direction="left"
          menuID="filters"
          icon={<FiltersIcon />}
          label="Filters"
          className={styles.filter_area}
        >
          <DropDown left menuID="filters">
            <motion.div key="filters" className={styles.filters_container}>
              <motion.div key="media" className={styles.filter_box}>
                <h1>Media Types</h1>
                <MediaFilter
                  key="video"
                  label="Video"
                  tagline="mp4, webm, gif"
                />{' '}
                <MediaFilter key="image" label="Image" tagline="jpeg, png" />
                <MediaFilter
                  key="audio"
                  label="Audio"
                  tagline="mp3, wav, flac"
                />
                <MediaFilter key="3d" label="3D" tagline="glb" />
                <MediaFilter
                  key="interactive"
                  label="HTML&SVG"
                  tagline="Interactive"
                />
                <MediaFilter key="text" label="Document" tagline="pdf, md" />
              </motion.div>
              <motion.div key="prices" className={styles.filter_box}>
                <h1>Price</h1>
                <div style={{ display: 'flex' }}>
                  <Input
                    type="number"
                    min={0}
                    max={1e6}
                    onChange={(e) => {
                      console.log(e.target.value)
                      setPrice({ ...price, from: e.target.value })
                      console.log(price)
                    }}
                    placeholder={`0`}
                    label="From"
                    value={price.from}
                  >
                    <Line/>
                  </Input>
                  <Input
                    type="number"
                    min={0}
                    max={1e6}
                    onChange={(e) => {
                      console.log(e.target.value)
                      setPrice({ ...price, to: e.target.value })
                      console.log(price)
                    }}
                    placeholder={`0`}
                    label="To"
                    value={price.to}
                  >
                    <Line/>
                  </Input>
                </div>
              </motion.div>
              <motion.div key="tags" className={styles.filter_box}>
                <h1>Featured tags</h1>
                <p className={styles.tagline}>Events</p>
                <div className={styles.tags}>
                  <Toggle
                    box
                    key="pakistan"
                    label="Pakistan"
                  />
                  <Toggle box key="ukraine" label="Ukraine" />
                  <Toggle box key="iran" label="Iran" />
                </div>
                <p className={styles.tagline}>Popular</p>
                <div className={styles.tags}>
                  <Toggle
                    box
                    key="pixelart"
                    label="pixelart"
                  />
                  <Toggle
                    box
                    key="generativeart"
                    label="generativeart"
                  />
                  <Toggle box key="gan" label="gan" />
                </div>
              </motion.div>
            </motion.div>
            <div key="confirm_box" className={styles.confirm_box}>
              <Button>
                Clear
              </Button>
              <Button onClick={() => context.closeDropdowns()}>
                Ok
              </Button>
            </div>
          </DropDown>
        </DropdownButton>
      )} */}
    </motion.div>
  )
}

export default FeedToolbar
