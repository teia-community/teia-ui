import { useContext, useMemo, useState } from 'react'
import { Container } from '@atoms/layout'
import { TxRow } from '@components/collab/show/TxRow'
import styles from '@components/collab/index.module.scss'
import { TeiaContext } from '@context/TeiaContext'
import classNames from 'classnames'
import { Button } from '@atoms/button'
import { useOutletContext } from 'react-router'

/**
 * The Transfer Tab
 * This allow the user to send tokens to a specific address.
 * @function
 * @param {{nft:import('@types').NFT}} props
 * @returns {any}
 */
export const Transfer = () => {
  const { nft } = useOutletContext()
  //const [title, setTitle] = useState()
  const { transfer, setFeedback, address, proxyAddress } =
    useContext(TeiaContext)

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

  const _update = (index, { to_, amount }) => {
    const updatedTxs = [...txs]

    updatedTxs[index] = {
      ...txSchema,
      to_,
      amount: Number(amount),
    }

    setTxs(updatedTxs)
  }

  const _addTransfer = () => {
    setTxs([...txs, { ...txSchema }])
  }

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
    setFeedback({
      message: 'Transfering tokens',
      progress: true,
      confirm: false,
      visible: true,
    })
    const validTxs = txs.filter((tx) => tx.to_ && tx.amount)
    transfer(validTxs)
  }

  const tableStyle = classNames(styles.table, styles.mt3, styles.mb3)

  const validTxs = txs.filter((t) => t.to_ && t.amount)

  const tokenCount = editionsHeld ? editionsHeld.amount : 0

  return (
    <Container>
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
          <div className={tableStyle}>
            {txs.map((tx, index) => (
              <TxRow
                key={`transfer-${index}`}
                tx={tx}
                onUpdate={(tx) => _update(index, tx)}
                onAdd={_addTransfer}
                onRemove={index < txs.length - 1 ? _deleteTransfer : null}
              />
            ))}
          </div>

          {/* <div className={styles.upload_container}>
                    <label>
                        <span>Upload CSV</span>
                        <input type="file" name="file" onChange={handleUpload} />
                    </label>
                </div> */}

          <Button
            onClick={onClick}
            disabled={validTxs.length === 0}
            shadow_box
            className={styles.btnSecondary}
          >
            send
          </Button>
        </div>
      )}
    </Container>
  )
}
