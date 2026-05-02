import { useState, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { Container } from '@atoms/layout'
import { Loading } from '@atoms/loading'
import { Input } from '@atoms/input'
import { Button } from '@atoms/button'
import styles from '@style'
import { useModalStore } from '@context/modalStore'
import { useUserStore } from '@context/userStore'
import { useObjktDisplayContext } from '..'
import {
  SWAP_TEIA_FEE_DISCLOSURE,
  maybeWarnLowSwapPrice,
  clampSwapAmountOnBlur,
  clampSwapPriceOnBlur,
} from '@utils/postMintSwap'

/**
 * The Swap Tab
 */
export const Swap = () => {
  /** @type {{nft:import('@types').NFT}} */
  const { nft } = useObjktDisplayContext()
  const { id } = useParams()

  const [address, proxyAddress, swap] = useUserStore((st) => [
    st.address,
    st.proxyAddress,
    st.swap,
  ])

  const [visible, progress, message, show] = useModalStore((st) => [
    st.visible,
    st.progress,
    st.message,
    st.show,
  ])

  const [amount, setAmount] = useState('')
  const [price, setPrice] = useState('')
  //const [progress, setProgress] = useState(false)
  const [currency, setCurrency] = useState('tez')

  const onChange = (e) => setCurrency(e.target.value)

  const checkPrice = (value) => {
    console.debug(value)
    maybeWarnLowSwapPrice(show, value)
  }

  const proxyAdminAddress = nft.artist_profile?.is_split
    ? nft.artist_profile.split_contract.administrator_address
    : null

  const found = useMemo(
    () =>
      nft.holdings?.find(
        (e) =>
          e.holder_address === address ||
          (e.holder_address === proxyAddress && address === proxyAdminAddress)
      ),
    [nft, address, proxyAddress, proxyAdminAddress]
  )

  const totalOwned = useMemo(() => found?.amount || 0, [found])

  const handleSubmit = async () => {
    console.debug({ amount, price })
    if (!amount) {
      show(`Please enter an OBJKT quantity to swap (current value: ${amount})`)
      return
    }

    if (price == null || price < 0) {
      show(`Please enter a price for the swap (current value: ${price})`)
      return
    }

    if (currency === 'tez') {
      // when taquito returns a success/fail message
      try {
        await swap(
          address,
          nft.royalties_total / 1000,
          (price * 1e6).toFixed(0),
          id,
          nft.artist_address,
          parseFloat(amount)
        )
      } catch (err) {
        show(`encountered an error: ${err})`)
        return
      }
    }
  }

  const style = {
    width: '75% !important',
  }

  return (
    <>
      {!visible ? (
        <div>
          <Container>
            <div className={styles.container}>
              <p>
                You own {totalOwned} editions of OBJKT#{id}. How many would you
                like to swap?
              </p>
            </div>
          </Container>

          <Container>
            <div className={styles.container}>
              <h4>Quantity</h4>
              <Input
                type="number"
                placeholder="OBJKT quantity"
                min={1}
                value={amount}
                /* max={total_amount - sales} */
                onChange={setAmount}
                onBlur={(e) => {
                  setAmount(
                    String(clampSwapAmountOnBlur(e.target.value, totalOwned))
                  )
                }}
                disabled={progress}
              />
              <div style={{ width: '100%', display: 'flex' }}>
                <div style={{ width: '100%' }}>
                  <h4>Price</h4>
                  <Input
                    style={style}
                    type="number"
                    placeholder="Price Per OBJKT (XTZ)"
                    value={price}
                    initial={0}
                    onChange={setPrice}
                    onBlur={(e) => {
                      const val = clampSwapPriceOnBlur(e.target.value)
                      setPrice(val)
                      checkPrice(val)
                    }}
                    disabled={progress}
                  />
                </div>
              </div>
              <Button shadow_box onClick={handleSubmit} fit disabled={progress}>
                Swap
              </Button>
            </div>
          </Container>

          <Container>
            <div className={styles.container}>
              <p>{SWAP_TEIA_FEE_DISCLOSURE}</p>
            </div>
          </Container>
        </div>
      ) : (
        <Container>
          <div>
            <p>{message}</p>
            <Loading />
          </div>
        </Container>
      )}
    </>
  )
}
