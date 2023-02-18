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
    if (value <= 0.1) {
      show(
        `Price is really low (${value}ꜩ), for giveaways checkout hicetdono (dono.xtz.tools)`
      )
    }
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

    // swap is valid call API
    console.debug(
      address,
      nft.royalties_total,
      parseFloat(price) * 1000000,
      id,
      nft.artist_address,
      parseFloat(amount)
    )
    console.log([
      address,
      nft.royalties_total,
      parseFloat(price) * 1e6,
      id,
      nft.artist_address,
      parseFloat(amount),
    ])
    if (currency === 'tez') {
      // when taquito returns a success/fail message
      await swap(
        address,
        nft.royalties_total / 1000,
        parseFloat(price) * 1e6,
        id,
        nft.artist_address,
        parseFloat(amount)
      )
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
              <Input
                type="number"
                placeholder="OBJKT quantity"
                min={1}
                value={amount}
                /* max={total_amount - sales} */
                onChange={setAmount}
                onBlur={(e) => {
                  if (parseInt(e.target.value) > totalOwned) {
                    setAmount(totalOwned)
                  }
                }}
                disabled={progress}
              />
              <div style={{ width: '100%', display: 'flex' }}>
                <div style={{ width: '90%' }}>
                  <Input
                    style={style}
                    type="number"
                    placeholder="Price per OBJKT"
                    value={price}
                    initial={0}
                    onChange={setPrice}
                    onBlur={(e) => {
                      const val = parseFloat(e.target.value)
                      if (val > 1e6) {
                        setPrice(1e6)
                      } else if (val < 0) {
                        setPrice(0)
                      }
                      checkPrice(val)
                    }}
                    disabled={progress}
                  />
                </div>
                <div>
                  <select
                    onChange={onChange}
                    style={{ float: 'right', display: 'inline' }}
                  >
                    <option value="tezos">tez</option>
                  </select>
                </div>
              </div>
              <Button shadow_box onClick={handleSubmit} fit disabled={progress}>
                Swap
              </Button>
            </div>
          </Container>

          <Container>
            <div className={styles.container}>
              <p>
                The Teia marketplace fee is temporarily set to 0%. Please
                consider donating to teiaescrow.tez
                (tz1Q7fCeswrECCZthfzx2joqkoTdyin8DDg8) for maintenance funding.
              </p>
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
