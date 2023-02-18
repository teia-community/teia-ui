import { Input } from '@atoms/input'
import styles from '../../collab/index.module.scss'
import { Button, Secondary } from '@atoms/button'
import { CloseIcon } from '@icons'
import { useState } from 'react'
import { validateAddress } from '@taquito/utils'
import { useModalStore } from '@context/modalStore'

export const TxRow = ({ tx, index, onUpdate, onAdd, onRemove }) => {
  const [amount, setAmount] = useState('')
  const [destination, setDestination] = useState('')

  const [valid, setValid] = useState(false)

  // TODO(mel): clean
  const show = useModalStore((st) => st.show)

  // const _update = (key, value) => {
  //   const updatedTx = {
  //     ...tx,
  //     [key]: value,
  //   }
  //   onUpdate(updatedTx)
  //   console.log({ key, value })
  // }

  const handleAdd = () => {
    if (validateAddress(destination)) {
      onAdd({ index, _to: destination, amount })
    } else {
      show('Transfer', `Invalid address ${destination}`)
    }
  }

  // Handle return key
  const _handleKeyPress = (event) => {
    if (event.code === 'Enter') {
      handleAdd()
    }
  }

  return tx ? (
    <tr className={styles.row}>
      <td style={{ width: '200px' }}>
        <Input
          type="number"
          name="transfer-quantity"
          label="Quantity"
          placeholder="OBJKT quantity"
          min={1}
          value={amount}
          onChange={setAmount}
          //onChange={(value) => _update('amount', value)}
        />
      </td>
      <td>
        <Input
          type="text"
          label="Recipient"
          placeholder="to address (tz...)"
          value={destination}
          onChange={setDestination}
          onKeyPress={_handleKeyPress}
        />
      </td>
      {onRemove && (
        <td className={styles.actionCell}>
          <Button fit onClick={onRemove}>
            <CloseIcon width={16} />
          </Button>
        </td>
      )}
      {!onRemove && destination && amount && (
        <td className={styles.actionCell} align="center">
          <Button fit shadow_box onClick={handleAdd}>
            add
          </Button>
        </td>
      )}
    </tr>
  ) : null
}
