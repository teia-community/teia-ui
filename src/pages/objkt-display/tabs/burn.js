import React, { useState, useContext, useMemo } from 'react'
import { HicetnuncContext } from '@context/HicetnuncContext'
import { Container } from '@atoms/layout'
import { Button, Purchase } from '@atoms/button'
import { Input } from '@atoms/input'
import { Loading } from '@atoms/loading'
import styles from '@style'

/**
 * The Burn Tab
 * @function
 * @param {{nft:import('@types').NFT}} props
 * @returns {any}
 */
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

  const proxyAdminAddress = nft.creator?.is_split
    ? nft.creator.shares[0].administrator
    : null

  const found = useMemo(
    () =>
      nft.token_holders?.find(
        (e) =>
          e.holder_id === acc?.address ||
          (e.holder_id === proxyAddress && acc?.address === proxyAdminAddress)
      ),
    [nft, acc, proxyAddress, proxyAdminAddress]
  )

  const totalOwned = useMemo(() => found?.quantity || 0, [found])

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
      burn(nft.token_id, amount)
    }
  }

  return (
    <>
      {!progress ? (
        <div>
          <Container>
            <div className={styles.container}>
              <p>
                You own {totalOwned} editions of OBJKT#{nft.id}. How many would
                you like to burn?
              </p>
            </div>
          </Container>
          <Container>
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
          </Container>

          <Container>
            <div className={styles.container}>
              <p style={{ fontSize: '14px' }}>
                Burning will transfer the OBJKTs from your possession to a burn
                address. Once in the burn address, the OBJKT can't be recovered
                or sold. You can only burn tokens that you own. If you have them
                swapped, you first need to cancel that swap before you try to
                burn them.
              </p>
              <br />
              <p>
                <strong>NB: This action is not reversable.</strong>
              </p>
            </div>
          </Container>

          <Container>
            <div className={styles.container}>
              <Button onClick={handleSubmit} fit>
                <Purchase>Burn</Purchase>
              </Button>
            </div>
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
