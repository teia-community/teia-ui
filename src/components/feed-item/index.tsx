import { PATH } from '@constants'
import { ItemInfoCompact } from '@components/item-info'
import { RenderMediaType } from '@components/media-types'
import styles from '@style'
import classnames from 'classnames'
import { useLocalSettings } from '@context/localSettingsStore'
import { Link } from 'react-router-dom'
import { shallow } from 'zustand/shallow'
import { useState, useRef } from 'react'
import { AnimatePresence } from 'framer-motion'
import { motion } from 'framer-motion'
import { NFT } from '@types'
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

const TokenHover = ({ nft, visible }: { nft: NFT; visible: boolean }) => {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div {...info_variants} className={styles.hover_details}>
          <h3
            aria-label={`OBJKT number ${nft.token_id}`}
            className={styles.hover_token_id}
          >
            #{nft.token_id}
          </h3>
          <h4>{nft.name}</h4>
          <p
            aria-label={`Description: ${nft.description}`}
            className={styles.hover_description}
          >
            {nft.description}
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export const FeedItem = ({ nft }: { nft: NFT }) => {
  const [nsfwFriendly, photosensitiveFriendly] = useLocalSettings(
    (state) => [state.nsfwFriendly, state.photosensitiveFriendly],
    shallow
  )
  const zen = useLocalSettings((st) => st.zen)
  const viewMode = useLocalSettings((st) => st.viewMode)
  const [hover, setHover] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleBlur = (e: React.FocusEvent) => {
    // Only hide hover if focus is leaving the container entirely
    if (!containerRef.current?.contains(e.relatedTarget as Node)) {
      setHover(false)
    }
  }

  const containerClasses = classnames({
    [styles.container]: true,
    [styles.blur]: nft.isNSFW && !nsfwFriendly,
    [styles.photo_protect]: nft.isPhotosensitive && !photosensitiveFriendly,
    [styles.masonry]: viewMode === 'masonry',
  })

  return (
    <div
      ref={containerRef}
      aria-label={`OBJKT ${nft.token_id}: ${nft.name}`}
      onMouseOver={() => setHover(true)}
      onMouseOut={() => setHover(false)}
      onFocus={() => setHover(true)}
      onBlur={handleBlur}
      className={containerClasses}
    >

      {nft.mime_type?.startsWith('audio') ? (
        <RenderMediaType
          details={<TokenHover nft={nft} visible={hover && !zen} />}
          nft={nft}
        />
      ) : (
        <Link
          aria-label={`View OBJKT ${nft.token_id}: ${nft.name}`}
          to={`${PATH.OBJKT}/${nft.token_id}`}
          onFocus={() => setHover(true)}
        >
          <RenderMediaType
            details={<TokenHover nft={nft} visible={hover && !zen} />}
            nft={nft}
          />
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
