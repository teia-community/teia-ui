import { useState, useMemo } from 'react'
import { Container } from '@atoms/layout'
import { Button } from '@atoms/button'
import { Input } from '@atoms/input'
import { Loading } from '@atoms/loading'
import styles from '@style'
import { useUserStore } from '@context/userStore'
import { useModalStore } from '@context/modalStore'
import { useObjktDisplayContext } from '..'

/**
 * The Burn Tab
 */
export const Burn = () => {
  const { nft } = useObjktDisplayContext()
  const [burn, address, proxyAddress] = useUserStore((st) => [
    st.burn,
    st.address,
    st.proxyAddress,
  ])
  const [modalVisible, message] = useModalStore((st) => [
    st.visible,
    st.message,
  ])

  const [amount, setAmount] = useState('')

  const proxyAdminAddress =
    nft.artist_profile?.split_contract?.administrator_address

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

    burn(nft.token_id, amount)
  }

  return (
    <>
      {!modalVisible ? (
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
                onChange={setAmount}
                onBlur={(e) => {
                  if (parseInt(e.target.value) >= totalOwned) {
                    setAmount(totalOwned)
                  }
                }}
                // disabled={modalVisible}
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
              <Button shadow_box onClick={handleSubmit} fit>
                Burn
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
            {message}
          </p>
          <Loading />
        </div>
      )}
    </>
  )
}
