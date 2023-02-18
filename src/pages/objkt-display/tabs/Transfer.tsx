import { useMemo, useState } from 'react'
import { TxRow } from '@components/collab/show/TxRow'
import styles from '@components/collab/index.module.scss'
import classNames from 'classnames'
import { Button } from '@atoms/button'
import { useOutletContext } from 'react-router'
import { useUserStore } from '@context/userStore'
import { useModalStore } from '@context/modalStore'
import { validateAddress } from '@taquito/utils'
// import { Buffer } from 'buffer'

/**
 * The Transfer Tab
 * This allow the user to send tokens to a specific address.
 */
export const Transfer = () => {
  /** @type {{nft:import('@types').NFT}} */
  const { nft } = useOutletContext()

  const [address, proxyAddress, transfer] = useUserStore((st) => [
    st.address,
    st.proxyAddress,
    st.transfer,
  ])
  const show = useModalStore((st) => st.show)

  const senderAddress = proxyAddress || address

  // See if the creator of this token is also the admin
  const proxyAdminAddress = nft.artist_profile?.is_split
    ? nft.artist_profile.split_contract.administrator_address
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
  const txSchema = {
    to_: undefined,
    amount: undefined,
    token_id: nft.token_id,
  }

  const [txs, setTxs] = useState([
    {
      ...txSchema,
    },
  ])

  const _update = (index, pt) => {
    console.log('update transfer', { pt, index, to: pt.to_, amount: pt.amount })
    const updatedTxs = [...txs]

    updatedTxs[index] = {
      ...txSchema,
      to_: pt.to_,
      amount: pt.amount,
    }

    setTxs(updatedTxs)
  }

  const addTransfer = (tx) => {
    console.log('adding transfers')
    console.log({ tx })

    setTxs([...txs, tx])
  }
  console.log(txs)
  const _deleteTransfer = ({ address }) => {
    const updatedTxs = [...txs]
    const toDeleteIndex = updatedTxs.findIndex((t) => t.address === address)
    updatedTxs.splice(toDeleteIndex, 1)
    setTxs(updatedTxs)
  }

  /*
    const handleUpload = async (event) => {
        const { files } = event.target
        const file = files[0]

        setTitle(file.name)
        const mimeType = file.type !== '' ? file.type : await getMimeType(file)
        const buffer = Buffer.from(await file.arrayBuffer())

        // set reader for preview
        const reader = new FileReader()
        reader.addEventListener('load', event => {
            console.log(file, event.target.result, buffer, mimeType);
            // onChange({ title, mimeType, file, buffer, reader: e.target.result })
        })

        reader.readAsDataURL(file)
    }
    */

  const onClick = () => {
    useModalStore.setState({
      message: 'Transfering tokens',
      progress: true,
      confirm: false,
      visible: true,
    })
    const validTxs = txs.filter((tx) => tx.to_ && tx.amount)
    transfer(validTxs)
  }

  const tableStyle = classNames(styles.table, styles.mt3, styles.mb3)

  // const validTxs = txs.filter((t) => t.to_ && t.amount)

  const tokenCount = editionsHeld ? editionsHeld.amount : 0
  return (
    <>
      {tokenCount === 0 ? (
        <div className={styles.container}>
          <p>No editions found to transfer.</p>
        </div>
      ) : (
        <div className={styles.container}>
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
                  // onUpdate={(tx) => _update(index, tx)}
                  onAdd={addTransfer}
                  onRemove={index < txs.length - 1 ? _deleteTransfer : null}
                />
              ))}
            </tbody>
          </table>

          {/* <div className={styles.upload_container}>
                    <label>
                        <span>Upload CSV</span>
                        <input type="file" name="file" onChange={handleUpload} />
                    </label>
                </div> */}

          <Button
            onClick={onClick}
            disabled={false /*validTxs.length === 0*/}
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
