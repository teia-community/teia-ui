import { useState, useContext, useMemo } from 'react'
import { useOutletContext, useParams } from 'react-router-dom'
import { TeiaContext } from '@context/TeiaContext'
import { Container } from '@atoms/layout'
import { Loading } from '@atoms/loading'
import { Input } from '@atoms/input'
import { Button } from '@atoms/button'
import styles from '@style'

/**
 * The Swap Tab
 */
export const Swap = () => {
  /** @type {{nft:import('@types').NFT}} */
  const { nft } = useOutletContext()
  const { id } = useParams()
  const {
    swap,
    address,
    progress,
    setProgress,
    proxyAddress,
    message,
    showFeedback,
    setMessage,
  } = useContext(TeiaContext)
  const [amount, setAmount] = useState('')
  const [price, setPrice] = useState('')
  //const [progress, setProgress] = useState(false)
  const [currency, setCurrency] = useState('tez')

  const onChange = (e) => setCurrency(e.target.value)

  const checkPrice = (value) => {
    console.debug(value)
    if (value <= 0.1) {
      showFeedback(
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
  console.log({ nft, found })
  const totalOwned = useMemo(() => found?.amount || 0, [found])

  const handleSubmit = async () => {
    console.debug({ amount, price })
    if (!amount) {
      showFeedback(
        `Please enter an OBJKT quantity to swap (current value: ${amount})`
      )
      return
    }

    if (price == null || price < 0) {
      showFeedback(
        `Please enter a price for the swap (current value: ${price})`
      )
      return
    }
    setProgress(true)
    setMessage('Preparing swap')
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
      try {
        // when taquito returns a success/fail message
        const answer = await swap(
          address,
          nft.royalties_total / 1000,
          parseFloat(price) * 1e6,
          id,
          nft.artist_address,
          parseFloat(amount)
        )
        setProgress(false)
        setMessage(answer.description)
      } catch (e) {
        console.error(e)
        setProgress(false)
        setMessage(`Error: ${e}`)
      }
    }
  }

  const style = {
    width: '75% !important',
  }

  return (
    <>
      {!progress ? (
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
                      if (val > 1e4) {
                        setPrice(1e4)
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
            {progress && <Loading />}
          </div>
        </Container>
      )}
    </>
  )
}
