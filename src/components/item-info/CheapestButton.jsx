import { Button } from '@atoms/button'
import MarketplaceLabel from '@atoms/marketplace-labels'
import { TeiaContext } from '@context/TeiaContext'
import styles from '@style'
import { useContext } from 'react'

const CheapestButton = ({ listing }) => {
  const { syncTaquito, collect, address } = useContext(TeiaContext)
  return listing ? (
    <div className={styles.main_swap}>
      <MarketplaceLabel listing={listing} />

      <Button
        onClick={() => {
          if (address == null) {
            syncTaquito()
          } else {
            collect(listing)
          }
        }}
        full
        shadow_box
      >
        Collect for {Number(listing.price) / 1e6} tez
      </Button>
    </div>
  ) : (
    <Button shadow_box full>
      Not for sale
    </Button>
  )
}

export default CheapestButton
