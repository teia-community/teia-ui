import { useEffect, useState } from 'react'
import { Button, Secondary } from '@atoms/button'
import { TipSelector } from './TipSelector'
import styles from '../index.module.scss'
import inputStyles from '@atoms/input/index.module.scss'
import classNames from 'classnames'
import { CloseIcon } from '@icons'
import { GetUserMetadata } from '@data/api'

export const BeneficiaryRow = ({
  beneficiary,
  onUpdate,
  onAdd,
  onRemove,
  onPasteMulti,
  onSelectPercentage,
  minimalView,
}) => {
  const [meta, setMeta] = useState()
  const [address, setAddress] = useState(beneficiary.address)
  const [shares, setShares] = useState(beneficiary.shares)

  useEffect(() => {
    const { address, shares } = beneficiary

    if (!meta && address) {
      GetUserMetadata(address).then(({ data }) => setMeta(data))
    }

    if (meta && !address) {
      setMeta()
    }

    setAddress(address)
    setShares(shares)
  }, [beneficiary, meta])

  const _update = (field, value) => {
    // If we have multiple lines, don't handle here
    const lines = value.replace(/\r/g, '').split(/\n/)

    if (lines.length > 1) {
      // send to parent to do the multi-split function
      onPasteMulti(value)
    } else {
      const updatedBeneficiary = {
        ...beneficiary,
        [field]: isNaN(value) ? value : Number(value),
      }

      onUpdate(updatedBeneficiary)
    }
  }

  // Combine H=N styles with module
  const cellClass = classNames(inputStyles.container, styles.input)

  const _onKeyDown = (event) => {
    if (event.keyCode === 13 && onAdd) {
      onAdd(beneficiary)
    }
  }

  // If the user has chosen from the popular projects list
  // the beneficiary data will contain the name of the project
  // otherwise just show "address" and the KT or tz hint if not populated

  const beneficiaryName = meta ? meta.alias : null
  const placeholderText =
    beneficiaryName || `${!address ? `(tz... or KT...)` : ''}`

  /**
   * In some situations we may want to show less UI information
   * eg. when adding beneficiarys, you don't need the whole
   * beneficiary UI open, so just show addresses and shares
   */
  return minimalView ? (
    <tr className={styles.row}>
      <td className={styles.addressCell}>{address}</td>
      <td className={styles.sharesCell}>{beneficiary.share}%</td>
    </tr>
  ) : (
    <tr className={styles.row}>
      <td className={styles.addressCell}>
        <div className={cellClass}>
          <label>
            <p>Address</p>
            <textarea
              rows={1}
              value={address || ''}
              className={styles.textInput}
              placeholder={placeholderText}
              onChange={(event) => _update('address', event.target.value)}
            />
          </label>
        </div>
      </td>

      <td className={styles.sharesCell}>
        <div className={cellClass}>
          <label>
            <p>Shares</p>
            <input
              type="number"
              placeholder="(proportional)"
              value={shares || ''}
              onKeyDown={_onKeyDown}
              onChange={(event) => _update('shares', event.target.value)}
            />
          </label>
          {!shares && onSelectPercentage && (
            <TipSelector onSelect={onSelectPercentage} />
          )}
        </div>
      </td>

      <td className={styles.actionCell}>
        <Button onClick={onRemove}>
          <Secondary>
            <CloseIcon />
          </Secondary>
        </Button>
      </td>
    </tr>
  )
}
