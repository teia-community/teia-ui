import { Button } from '@atoms/button'
// import { PATH } from '@constants'
import { walletPreview } from '@utils/string'
import { isNumber } from 'lodash'
import styles from '@style'
import Editions from './Editions'
import useLocalSettings from '@hooks/use-local-settings'

/**
 * @param {Object} itemInfoCompactOptions
 * @param {import("@types").NFT} itemInfoCompactOptions.nft
 **/
const ItemInfoCompact = ({ nft }) => {
  const { zen /*viewMode*/ } = useLocalSettings()
  const _price = !zen
    ? isNumber(nft.price)
      ? (Number(nft.price) / 1e6).toString()
      : 'X'
    : null

  const price = (
    <span>
      {_price}
      <span className={styles.tz}>ꜩ</span>
    </span>
  )

  return (
    <div className={`${styles.compact_container} ${styles.masonry}`}>
      {/* <Button
          alt={`Go to OBJKT ${nft.token_id}`}
          to={`${PATH.OBJKT}/${nft.token_id}`}
        >
          <Primary label={`object ${nft.token_id}`}>#{nft.token_id}</Primary>
        </Button> */}
      <Button
        className={styles.artist}
        alt={`Go to artist page of token #${nft.token_id}`}
        to={
          nft.artist_profile?.name
            ? `/${nft.artist_profile.name}`
            : `/tz/${nft.artist_address}`
        }
      >
          {nft.artist_profile?.name
            ? nft.artist_profile.name
            : walletPreview(nft.artist_address)}
      </Button>
      <Editions className={styles.editions} nft={nft} />
      {price}
    </div>
  )
}

export default ItemInfoCompact
