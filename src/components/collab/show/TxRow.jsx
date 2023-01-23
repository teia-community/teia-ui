import { Input } from '@atoms/input'
import styles from '../../collab/index.module.scss'
import { Button, Secondary } from '@atoms/button'
import { CloseIcon } from '../index'

export const TxRow = ({ tx, onUpdate, onAdd, onRemove }) => {
  const _update = (key, value) => {
    const updatedTx = {
      ...tx,
      [key]: value,
    }

    onUpdate(updatedTx)
  }

  // Handle return key
  const _handleKeyPress = (event) => {
    if (event.code === 'Enter') {
      onAdd()
    }
  }

  return tx ? (
    <tr className={styles.row}>
      <td style={{ width: '200px' }}>
        <Input
          type="text"
          name="transfer-quantity"
          label="Quantity"
          placeholder="OBJKT quantity"
          min={1}
          value={tx.amount}
          onChange={(event) => _update('amount', event.target.value)}
        />
      </td>
      <td>
        <Input
          type="text"
          label="Recipient"
          placeholder="to address (tz...)"
          value={tx.to_}
          onChange={(event) => _update('to_', event.target.value)}
          onKeyPress={_handleKeyPress}
        />
      </td>

      {onRemove && (
        <td className={styles.actionCell}>
          <Button onClick={onRemove}>
            <Secondary>
              <CloseIcon />
            </Secondary>
          </Button>
        </td>
      )}

      {!onRemove && tx.to_ && tx.amount && (
        <td>
          <Button shadow_box onClick={onAdd}>
            add
          </Button>
        </td>
      )}
    </tr>
  ) : null
}
