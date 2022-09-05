import React, { useState, useContext } from 'react'
import { HicetnuncContext } from '@context/HicetnuncContext'
import { Container, Padding } from '@components/layout'
import { Button, Purchase } from '@components/button'
import { Input } from '@components/input'
import { Loading } from '@components/loading'
import styles from '../styles.module.scss'

export const Burn = ({ nft }) => {
  const {
    burn,
    acc,
    proxyAddress,
    message,
    setMessage,
    setProgress,
    progress,
  } = useContext(HicetnuncContext)
  const [amount, setAmount] = useState('')

  let totalOwned = 0

  const proxyAdminAddress = nft.creator.is_split
    ? nft.creator.shares[0].administrator
    : null

  const found = nft.token_holders.find(
    (e) =>
      e.holder_id === acc?.address ||
      (e.holder_id === proxyAddress && acc?.address === proxyAdminAddress)
  )

  if (found) {
    totalOwned = found.quantity
  }

  const handleSubmit = () => {
    if (amount === '' || amount === '0') {
      alert('Error: No amount specified.')
      return
    }

    if (amount > totalOwned) {
      alert(
        `Error: You're trying to burn ${amount}, but you only own ${totalOwned}.`
      )
      return
    }

    const r = global.confirm(
      `Are you sure you want to burn ${amount} of ${totalOwned}?`
    )
    if (r) {
      setProgress(true)
      setMessage('Burning OBJKT')
      burn(nft.id, amount)
    }
  }

  return (
    <>
      {!progress ? (
        <div>
          <Container>
            <Padding>
              <div className={styles.container}>
                <p>
                  You own {totalOwned} editions of OBJKT#{nft.id}. How many
                  would you like to burn?
                </p>
              </div>
            </Padding>
          </Container>
          <Container>
            <Padding>
              <div className={styles.container}>
                <Input
                  type="number"
                  placeholder="OBJKTs to burn"
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value)
                  }}
                  onBlur={(e) => {
                    if (parseInt(e.target.value) >= totalOwned) {
                      setAmount(totalOwned)
                    }
                  }}
                  disabled={progress}
                />
              </div>
            </Padding>
          </Container>

          <Container>
            <Padding>
              <div className={styles.container}>
                <p style={{ fontSize: '14px' }}>
                  Burning will transfer the OBJKTs from your possession to a
                  burn address. Once in the burn address, the OBJKT can't be
                  recovered or sold. You can only burn tokens that you own. If
                  you have them swapped, you first need to cancel that swap
                  before you try to burn them.
                </p>
                <br />
                <p>
                  <strong>NB: This action is not reversable.</strong>
                </p>
              </div>
            </Padding>
          </Container>

          <Container>
            <Padding>
              <div className={styles.container}>
                <Button onClick={handleSubmit} fit>
                  <Purchase>Burn</Purchase>
                </Button>
              </div>
            </Padding>
          </Container>
        </div>
      ) : (
        <div>
          <p
            style={{
              position: 'absolute',
              left: '50%',
              top: '35%',
            }}
          >
            {' '}
            {message}
          </p>
          {progress && <Loading />}
        </div>
      )}
    </>
  )
}
