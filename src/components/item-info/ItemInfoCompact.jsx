import { Button, Primary } from '@atoms/button'
import { PATH } from '@constants'
import { walletPreview } from '@utils/string'
import { get, isNumber } from 'lodash'
import styles from '@style'
import { Editions } from './Editions'

/**
 * @param {Object} itemInfoCompactOptions
 * @param {import("@types").NFT} itemInfoCompactOptions.nft
 **/
export const ItemInfoCompact = ({ nft }) => {
  let zen = false
  let _price = null

  if (!zen) {
    _price = isNumber(nft.price)
      ? (Number(nft.price) / 1000000).toString()
      : 'X'
  }

  const price = (
    <span>
      {_price}
      <span className={styles.tz}>ꜩ</span>
    </span>
  )

  return (
    <div className={styles.compact_container}>
      <div className={styles.infos_left}>
        <Button to={`${PATH.OBJKT}/${nft.token_id}`}>
          <Primary label={`object ${nft.token_id}`}>#{nft.token_id}</Primary>
        </Button>
        <Button
          to={
            get(nft, 'artist_profile.name')
              ? `/${get(nft, 'artist_profile.name')}`
              : `/tz/${nft.artist_address}`
          }
        >
          <Primary className={styles.artist}>
            {get(nft, 'artist_profile.name')
              ? encodeURI(get(nft, 'artist_profile.name'))
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
