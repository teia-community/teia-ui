// ! NOTE - Keep the comments.
import { motion } from 'framer-motion'
import styles from '@style'
import { DropDown, DropdownButton } from '@atoms/dropdown'
import { IconToggle } from '@atoms/toggles'
import { SingleViewIcon, MasonryIcon, ChevronIcon } from '@icons'

import { Button } from '@atoms/button'

import { useLocalSettings } from '@context/localSettingsStore'
import { useLocation, useNavigate } from 'react-router'
import { Line } from '@atoms/line'
import { shallow } from 'zustand/shallow'
import { FEED_MAP, DEFAULT_START_FEED } from '@constants'

// const MediaFilter = ({ label, tagline }) => {
//   return (
//     <div className={styles.media_type}>
//       <Toggle box label={label} />
//       <p className={styles.tagline}>{tagline}</p>
//     </div>
//   )
// }

const locationMap = new Map([
  ['/feed/sales', FEED_MAP['Recent Sales']],
  ['/feed/random', FEED_MAP['Random']],
  ['/feed/newobjkts', FEED_MAP['New OBJKTs']],
  ['/feed/friends', FEED_MAP['Friends']],
  // separator
  ['---fund_feeds', 'fund_feeds'],
  ['/feed/quake-aid', FEED_MAP['Quake Aid']],
  ['/feed/ukraine', FEED_MAP['🇺🇦 Ukraine']],
  ['/feed/pakistan', FEED_MAP['🇵🇰 Pakistan']],
  ['/feed/iran', FEED_MAP['🇮🇷 Iran']],
  ['/feed/tezospride', FEED_MAP['🏳️‍🌈 Tezospride']],
  // separator
  ['---mime_feeds', 'mime_feeds'],
  ['/feed/image', FEED_MAP['Image']],
  ['/feed/video', FEED_MAP['Video']],
  ['/feed/audio', FEED_MAP['Audio']],
  ['/feed/glb', FEED_MAP['3D']],
  ['/feed/html-svg', FEED_MAP['HTML & SVG']],
  ['/feed/gif', FEED_MAP['GIF']],
  ['/feed/pdf', FEED_MAP['PDF']],
  ['/feed/md', FEED_MAP['Markdown']],
])

const locationNeedSync = ['/feed/friends']

export const FeedToolbar = ({ feeds_menu = false }) => {
  // const [price, setPrice] = useState({ from: 0, to: 0 })

  const [viewMode, setViewMode, startFeed] = useLocalSettings(
    (st) => [st.viewMode, st.setViewMode, st.startFeed],
    shallow
  )
  const location = useLocation()
  const feedLabel =
    locationMap.get(location.pathname) ||
    startFeed ||
    FEED_MAP[DEFAULT_START_FEED]

  const navigate = useNavigate()

  // TODO: finish the filtering logic
  // const filters = false
  return (
    <motion.div className={styles.toolbar}>
      {feeds_menu && (
        <div className={styles.feeds_area}>
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
                    return <Line className={styles.separator} key={k} />
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
      <div className={styles.view_mode_area}>
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
