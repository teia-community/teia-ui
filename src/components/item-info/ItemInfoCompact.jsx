import { Button, Primary } from '@atoms/button'
import { PATH } from '@constants'
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
  const { zen } = useLocalSettings()
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
    <div className={styles.compact_container}>
      <div className={styles.infos_left}>
        <Button
          alt={`Go to OBJKT ${nft.token_id}`}
          to={`${PATH.OBJKT}/${nft.token_id}`}
        >
          <Primary label={`object ${nft.token_id}`}>#{nft.token_id}</Primary>
        </Button>
        <Button
          alt="Go to artist page"
          to={
            nft.artist_profile?.name
              ? `/${nft.artist_profile.name}`
              : `/tz/${nft.artist_address}`
          }
        >
          <Primary className={styles.artist}>
            {nft.artist_profile?.name
              ? encodeURI(nft.artist_profile.name)
              : walletPreview(nft.artist_address)}
          </Primary>
        </Button>
      </div>
      <div className={styles.infos_right}>
        <Editions nft={nft} />
        {price}
      </div>
    </div>
  )
}

export default ItemInfoCompact
