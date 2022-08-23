import React, { useState, useContext } from 'react'
import { useParams } from 'react-router-dom'
import { HicetnuncContext } from '@context/HicetnuncContext'
import { Container, Padding } from '@components/layout'
import { Loading } from '@components/loading'
import { Input } from '@components/input'
import { Button, Purchase } from '@components/button'
import styles from '../styles.module.scss'

export const Swap = ({
  total_amount,
  token_holders,
  owners,
  creator,
  royalties,
  token_info,
  address,
  restricted,
}) => {
  let totalOwned = 0
  const { id } = useParams()
  const {
    swap,
    acc,
    progress,
    setProgress,
    proxyAddress,
    message,
    showFeedback,
    setMessage,
  } = useContext(HicetnuncContext)
  const [amount, setAmount] = useState()
  const [price, setPrice] = useState()
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

  const proxyAdminAddress = creator.is_split
    ? creator.shares[0].administrator
    : null
  const found = token_holders.find(
    (e) =>
      e.holder_id === acc?.address ||
      (e.holder_id === proxyAddress && acc?.address === proxyAdminAddress)
  )

  if (found) {
    totalOwned = found.quantity
  }

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
      acc.address,
      royalties,
      parseFloat(price) * 1000000,
      id,
      creator.address,
      parseFloat(amount)
    )

    if (currency === 'tez') {
      try {
        // when taquito returns a success/fail message
        const answer = await swap(
          acc.address,
          royalties,
          parseFloat(price) * 1e6,
          id,
          creator.address,
          parseFloat(amount)
        )
        setProgress(false)
        setMessage(answer.description)
      } catch (e) {
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
            <Padding>
              <div className={styles.container}>
                <p>
                  You own {totalOwned} editions of OBJKT#{id}. How many would
                  you like to swap?
                </p>
              </div>
            </Padding>
          </Container>

          <Container>
            <Padding>
              <div className={styles.container}>
                <Input
                  type="number"
                  placeholder="OBJKT quantity"
                  min={1}
                  value={amount}
                  /* max={total_amount - sales} */
                  onChange={(e) => setAmount(e.target.value)}
                  onBlur={(e) => {
                    if (parseInt(e.target.value) > totalOwned) {
                      setAmount(totalOwned)
                    }
                  }}
                  onWheel={(e) => e.target.blur()}
                  disabled={progress}
                />
                <div style={{ width: '100%', display: 'flex' }}>
                  <div style={{ width: '90%' }}>
                    <Input
                      style={style}
                      type="number"
                      placeholder="Price per OBJKT"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      onBlur={(e) => {
                        const val = parseFloat(e.target.value)
                        if (val > 1e4) {
                          setPrice(1e4)
                        } else if (val < 0) {
                          setPrice(0)
                        }
                        checkPrice(val)
                      }}
                      onWheel={(e) => e.target.blur()}
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
                <Button onClick={handleSubmit} fit disabled={progress}>
                  <Purchase>Swap</Purchase>
                </Button>
              </div>
            </Padding>
          </Container>

          <Container>
            <Padding>
              <div className={styles.container}>
                <p>
                  The Teia marketplace fee is temporarily set to 0%. Please
                  consider donating to teiaescrow.tez
                  (tz1Q7fCeswrECCZthfzx2joqkoTdyin8DDg8) for maintenance
                  funding.
                </p>
              </div>
            </Padding>
          </Container>
        </div>
      ) : (
        <Container>
          <Padding>
            <div>
              <p>{message}</p>
              {progress && <Loading />}
            </div>
          </Padding>
        </Container>
      )}
    </>
  )
}
