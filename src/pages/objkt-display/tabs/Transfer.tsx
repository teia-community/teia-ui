import { useMemo, useState } from 'react'
import { TxRow } from '@components/collab/show/TxRow'
import styles from '@components/collab/index.module.scss'
import classNames from 'classnames'
import { Button } from '@atoms/button'
import { useUserStore } from '@context/userStore'
import { useObjktDisplayContext } from '..'
import type { TxWithIndex } from '@types'

/**
 * The Transfer Tab
 * This allow the user to send tokens to a specific address.
 */
export const Transfer = () => {
  const { nft } = useObjktDisplayContext()

  const [address, proxyAddress, transfer] = useUserStore((st) => [
    st.address,
    st.proxyAddress,
    st.transfer,
  ])

  const senderAddress = proxyAddress || address

  // See if the creator of this token is also the admin
  const proxyAdminAddress = nft.artist_profile?.is_split
    ? nft.artist_profile?.split_contract?.administrator_address
    : null
  //
  // How many editions are held by the contract?
  const editionsHeld = useMemo(
    () =>
      nft.holdings?.find(
        (e) =>
          e.holder_address === senderAddress &&
          (address === senderAddress || address === proxyAdminAddress)
      ),
    [nft, address, proxyAdminAddress, senderAddress]
  )

  // The basic schema for a transaction
  const txSchema: TxWithIndex = {
    index: 0,
    to_: undefined,
    amount: undefined,
    token_id: nft.token_id,
  }

  const [txs, setTxs] = useState<TxWithIndex[]>([
    {
      ...txSchema,
    },
  ])
  const tableStyle = classNames(styles.table, styles.mt3, styles.mb3)
  const validTxs = txs.filter((t) => t?.to_ && t?.amount)

  const addTransfer = (tx: TxWithIndex) => {
    const updatedTxs = [...txs]
    updatedTxs[tx.index] = tx
    setTxs([...updatedTxs, { ...txSchema, index: updatedTxs.length }])
  }

  const deleteTransfer = (tx: TxWithIndex) => {
    const updatedTxs = [...txs]
    delete updatedTxs[tx.index]
    setTxs(updatedTxs)
  }

  const onClick = () => {
    transfer(validTxs)
  }

  const tokenCount = editionsHeld ? editionsHeld.amount : 0
  return (
    <>
      {tokenCount === 0 ? (
        <div className={styles.container}>
          <p>No editions found to transfer.</p>
        </div>
      ) : (
        <div className={styles.container}>
          <h2>
            Transfer (count: {validTxs.length}/{tokenCount})
          </h2>
          <p>
            Add addresses below along with how many tokens you wish to send to
            each.
          </p>
          <p>You currently have {tokenCount} editions available.</p>
          <table className={tableStyle}>
            <tbody>
              {txs.map((tx, index) => (
                <TxRow
                  key={`transfer-${index}`}
                  tx={tx}
                  index={index}
                  onAdd={addTransfer}
                  onRemove={index < txs.length - 1 ? deleteTransfer : undefined}
                />
              ))}
            </tbody>
          </table>

          <Button
            alt={'Click to transfer the token to the selected wallets'}
            onClick={onClick}
            disabled={validTxs.length === 0}
            shadow_box
            className={styles.btnSecondary}
          >
            send
          </Button>
        </div>
      )}
    </>
  )
}
