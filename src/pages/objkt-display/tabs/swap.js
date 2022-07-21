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
    setMessage,
  } = useContext(HicetnuncContext)
  const [amount, setAmount] = useState()
  const [price, setPrice] = useState()
  //const [progress, setProgress] = useState(false)
  const [currency, setCurrency] = useState('tez')

  const onChange = (e) => setCurrency(e.target.value)

  const checkPrice = (value) => {
    if (value <= 0.1) {
      setPrice(value)
      setMessage(
        'please note that items intended to be giveaways can be collected in multiple editions and resold in large quantities. please ensure you are happy with the quantity and price chosen before swapping'
      )
      return
    }

    setPrice(value)
    setMessage('')
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

  const handleSubmit = () => {
    console.log(currency)

    if (!amount || amount === '' || !price || price === '') {
      // simple validation for now
      alert('invalid input')
    } else {
      //setProgress(true)
      setProgress(true)
      setMessage('preparing swap')
      // swap is valid call API
      console.log(
        acc.address,
        royalties,
        parseFloat(price) * 1000000,
        id,
        creator.address,
        parseFloat(amount)
      )

      if (currency === 'tez') {
        swap(
          acc.address,
          royalties,
          parseFloat(price) * 1000000,
          id,
          creator.address,
          parseFloat(amount)
        )
          //swap(parseFloat(amount), id, parseFloat(price) * 1000000)
          .then((e) => {
            // when taquito returns a success/fail message
            //setProgress(false)
            setProgress(false)
            setMessage(e.description)
          })
          .catch((e) => {
            setProgress(false)
            setMessage('error')
          })
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
                  defaultValue={amount}
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
                      onChange={(e) => checkPrice(parseFloat(e.target.value))}
                      onBlur={(e) => {
                        if (parseFloat(e.target.value) > 10000) {
                          setPrice(10000)
                        }
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
                  consider donating to teiaescrow.tez (tz1Q7fCeswrECCZthfzx2joqkoTdyin8DDg8) for maintenance funding.
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
