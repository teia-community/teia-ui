import { Button } from '@atoms/button'
import { Purchase } from '@atoms/button'
import { MarketplaceLabel } from '@atoms/marketplace-labels'
import { TeiaContext } from '@context/TeiaContext'
import styles from '@style'
import { useContext } from 'react'

const CheapestButton = ({ listing }) => {
  const { syncTaquito, collect, acc } = useContext(TeiaContext)
  return listing ? (
    <div className={styles.main_swap}>
      <MarketplaceLabel listing={listing} />

      <Button
        onClick={() => {
          if (acc == null) {
            syncTaquito()
          } else {
            collect(listing)
          }
        }}
        full
      >
        <Purchase>Collect for {Number(listing.price) / 1000000} tez</Purchase>
      </Button>
    </div>
  ) : (
    <Button full>
      <Purchase>Not for sale</Purchase>
    </Button>
  )
}

export default CheapestButton
