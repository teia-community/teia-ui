import { PATH } from '@constants'
import { ItemInfoCompact } from '@components/item-info'
import { RenderMediaType } from '@components/media-types'
import styles from '@style'
import classnames from 'classnames'
import { useLocalSettings } from '@context/localSettingsStore'
import { Link } from 'react-router-dom'
import { shallow } from 'zustand/shallow'
import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { motion } from 'framer-motion'
/**
 * @param {Object} feedOptions - The options for the feed item
 * @param {import("@types").NFT} feedOptions.nft - The nft to render
 * @returns {React.ReactElement} The feed item
 */

const info_variants = {
  initial: {
    opacity: 0,
  },
  animate: {
    opacity: 1,
  },
  exit: {
    opacity: 0,
  },
}
export const FeedItem = ({ nft }) => {
  const [nsfwFriendly, photosensitiveFriendly] = useLocalSettings(
    (state) => [state.nsfwFriendly, state.photosensitiveFriendly],
    shallow
  )
  const zen = useLocalSettings((st) => st.zen)
  const viewMode = useLocalSettings((st) => st.viewMode)
  // const element = (hovered) => <div>Hover me! {hovered && 'Thanks!'}</div>
  const [hover, setHover] = useState(false)

  const containerClasses = classnames({
    [styles.container]: true,
    [styles.blur]: nft.isNSFW && !nsfwFriendly,
    [styles.photo_protect]: nft.isPhotosensitive && !photosensitiveFriendly,
    [styles.masonry]: viewMode === 'masonry',
  })

  return (
    <div
      onMouseOver={() => setHover(true)}
      onFocus={() => setHover(true)}
      onMouseOut={() => setHover(false)}
      onBlur={() => setHover(false)}
      // onMouseEnter={() => setHover(true)}
      // onMouseLeave={() => setHover(false)}
      className={containerClasses}
    >
      <AnimatePresence>
        {hover && (
          <motion.div {...info_variants} className={styles.hover_details}>
            <h1>{nft.name}</h1>
            <p>{nft.description}</p>
          </motion.div>
        )}
      </AnimatePresence>
      {nft.mime_type?.startsWith('audio') ? (
        <RenderMediaType nft={nft} />
      ) : (
        <Link
          aria-label={`OBJKT ${nft.token_id}`}
          to={`${PATH.OBJKT}/${nft.token_id}`}
        >
          <RenderMediaType nft={nft} />
        </Link>
      )}
      {!zen && (
        <div className={styles.token_infos_container}>
          <ItemInfoCompact nft={nft} />
        </div>
      )}
    </div>
  )
}
