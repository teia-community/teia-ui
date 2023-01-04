import { motion } from 'framer-motion'
import styles from '@style'
import { HeaderButton } from '../HeaderButton'
import { DropDown } from '@atoms/dropdown'
import { Toggle, toggleType } from '@atoms/toggles'
import { ReactComponent as SingleIcon } from '../icons/single_view.svg'
import { ReactComponent as MasonryIcon } from '../icons/masonry.svg'
import { ReactComponent as FiltersIcon } from '../icons/filters.svg'

import useLocalSettings from '@hooks/use-local-settings'
import { Input } from '@atoms/input'
import { useContext, useState } from 'react'
import { Button, Primary } from '@atoms/button'
import { TeiaContext } from '@context/TeiaContext'

const MediaFilter = ({ label, tagline }) => {
  return (
    <div className={styles.media_type}>
      <Toggle kind={toggleType.BOX} label={label} />
      <p className={styles.tagline}>{tagline}</p>
    </div>
  )
}

export const FilterBar = () => {
  const { setViewMode, viewMode } = useLocalSettings()
  const [price, setPrice] = useState({ from: 0, to: 0 })
  const context = useContext(TeiaContext)
  let drop
  // TODO: finish the filtering logic
  const filters = true
  return (
    <motion.div className={styles.filter_bar}>
      <div className={styles.view_mode}>
        <Toggle
          kind={toggleType.MINIMAL}
          toggled={viewMode === 'single'}
          onToggle={() => {
            setViewMode('single')
          }}
          label={<SingleIcon />}
        />
        <Toggle
          kind={toggleType.MINIMAL}
          toggled={viewMode === 'masonry'}
          onToggle={() => setViewMode('masonry')}
          label={<MasonryIcon />}
        />
      </div>
      {filters && (
        <HeaderButton
          direction="left"
          menuID="filters"
          icon={<FiltersIcon />}
          label="Filters"
          className={styles.filter_button}
        >
          <DropDown ref={drop} left menuID="filters">
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
                    <span className={styles.line} />
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
                    <span className={styles.line} />
                  </Input>
                </div>
              </motion.div>
              <motion.div key="tags" className={styles.filter_box}>
                <h1>Featured tags</h1>
                <p className={styles.tagline}>Events</p>
                <div className={styles.tags}>
                  <Toggle
                    kind={toggleType.BOX}
                    key="pakistan"
                    label="Pakistan"
                  />
                  <Toggle kind={toggleType.BOX} key="ukraine" label="Ukraine" />
                  <Toggle kind={toggleType.BOX} key="iran" label="Iran" />
                </div>
                <p className={styles.tagline}>Popular</p>
                <div className={styles.tags}>
                  <Toggle
                    kind={toggleType.BOX}
                    key="pixelart"
                    label="pixelart"
                  />
                  <Toggle
                    kind={toggleType.BOX}
                    key="generativeart"
                    label="generativeart"
                  />
                  <Toggle kind={toggleType.BOX} key="gan" label="gan" />
                </div>
              </motion.div>
            </motion.div>
            <div key="confirm_box" className={styles.confirm_box}>
              <Button>
                <Primary>Clear</Primary>
              </Button>
              <Button onClick={() => context.closeDropdowns()}>
                <Primary>Ok</Primary>
              </Button>
            </div>
          </DropDown>
        </HeaderButton>
      )}
    </motion.div>
  )
}

export default FilterBar
