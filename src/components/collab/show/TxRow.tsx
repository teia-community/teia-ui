import { Input } from '@atoms/input'
import styles from '../../collab/index.module.scss'
import { Button } from '@atoms/button'
import { CloseIcon } from '@icons'
import { KeyboardEvent, useState } from 'react'
import { validateAddress } from '@taquito/utils'
import { useModalStore } from '@context/modalStore'
import type { TxWithIndex } from '@types'

interface TxRowProps {
  tx: TxWithIndex
  index: number
  onAdd: (tx: TxWithIndex) => void
  onRemove?: (tx: TxWithIndex) => void
}

export const TxRow = ({ tx, index, onAdd, onRemove }: TxRowProps) => {
  const [amount, setAmount] = useState('')
  const [destination, setDestination] = useState('')
  const show = useModalStore((st) => st.show)

  const handleAdd = () => {
    if (validateAddress(destination)) {
      onAdd({
        index,
        to_: destination,
        amount: parseInt(amount),
        token_id: tx.token_id,
      })
    } else {
      show('Transfer', `Invalid address ${destination}`)
    }
  }
  // Handle return key
  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
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
          onChange={(v) => {
            if (typeof v === 'number') setAmount(v.toString())
          }}
        />
      </td>
      <td>
        <Input
          type="text"
          label="Recipient"
          placeholder="to address (tz...)"
          value={destination}
          onChange={(v) => {
            if (typeof v === 'string') {
              setDestination(v)
            }
          }}
          onKeyDown={handleKeyDown}
        />
      </td>
      {onRemove && (
        <td className={styles.actionCell}>
          <Button
            alt={'Click to delete this transfer'}
            fit
            onClick={() => onRemove(tx)}
          >
            <CloseIcon width={16} />
          </Button>
        </td>
      )}
      {!onRemove && destination && amount && (
        <td className={styles.actionCell} align="center">
          <Button
            alt={'Add transfer to batch list'}
            fit
            shadow_box
            onClick={handleAdd}
          >
            add
          </Button>
        </td>
      )}
    </tr>
  ) : null
}
