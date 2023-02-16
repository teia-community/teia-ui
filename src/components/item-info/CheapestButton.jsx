import { Button } from '@atoms/button'
import MarketplaceLabel from '@atoms/marketplace-labels'
import styles from '@style'
import { useUserStore } from '@context/userStore'

const CheapestButton = ({ listing }) => {
  const [address, sync, collect] = useUserStore((st) => [
    st.address,
    st.sync,
    st.collect,
  ])
  return listing ? (
    <div className={styles.main_swap}>
      <MarketplaceLabel listing={listing} />

      <Button
        onClick={() => {
          if (address == null) {
            sync()
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
