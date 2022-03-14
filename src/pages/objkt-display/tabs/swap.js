import React, { useState, useContext } from 'react'
import { useParams } from 'react-router-dom'
import { HicetnuncContext } from '../../../context/HicetnuncContext'
import { Container, Padding } from '../../../components/layout'
import { Loading } from '../../../components/loading'
import { Input } from '../../../components/input'
import { Button, Purchase } from '../../../components/button'
import styles from '../styles.module.scss'

export const Swap = ({
  total_amount,
  owners,
  creator,
  royalties,
  token_info,
  address,
  restricted,
}) => {
  const { id } = useParams()
  const { swap, acc, progress, setProgress, message, setMessage } =
    useContext(HicetnuncContext)
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
    } else {
      setPrice(value)
      setMessage('')
    }

    if (value === '') {
      setPrice(value)
      setMessage('')
    }
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
                <Input
                  type="number"
                  placeholder="OBJKT quantity"
                  min={1}
                  defaultValue={amount}
                  /* max={total_amount - sales} */
                  onChange={(e) => setAmount(e.target.value)}
                  onWheel={(e) => e.target.blur()}
                  disabled={progress}
                />
                <div style={{ width: '100%', display: 'flex' }}>
                  <div style={{ width: '90%' }}>
                    <Input
                      style={style}
                      type="number"
                      placeholder="Price per OBJKT"
                      min={0}
                      max={10000}
                      onChange={(e) => checkPrice(e.target.value)}
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
                  swaps which carry values are charged with a 2.5% fee for
                  platform maintenance
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
