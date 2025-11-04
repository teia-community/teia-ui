import { useUserStore } from '@context/userStore'
import { TEIA_FOUNTAIN_CONTRACT } from '@constants'

import { useState } from 'react'
import styles from './index.module.scss'

const FountainDonateInput = () => {
  const [amount, setAmount] = useState('')
  const [donate] = useUserStore((st) => [st.donate])

  const handleAmountChange = (event) => {
    setAmount(event.target.value)
  }

  const handleDonateClick = () => {
    const amountAsNumber = parseFloat(amount)
    if (isNaN(amountAsNumber) || amountAsNumber <= 0) {
      alert('Please enter a valid donation amount')
      return
    }
    donate(amountAsNumber, TEIA_FOUNTAIN_CONTRACT)
  }

  return (
    <div className={styles.daoDonateButton}>
      <h4>Donate to TEIA Fountain</h4>
      <p>Address: {TEIA_FOUNTAIN_CONTRACT}</p>
      <input
        type="number"
        value={amount}
        onChange={handleAmountChange}
        placeholder="Enter Number in XTZ"
        inputMode="decimal"
        pattern="[0-9]*"
        min="0"
        className={styles.donateInput}
      />
      <br />
      <input
        type="button"
        value={`Donate ${amount} XTZ`}
        onClick={handleDonateClick}
        className={styles.donateButton}
      />
    </div>
  )
}

export default FountainDonateInput
