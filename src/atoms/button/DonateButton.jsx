import { useUserStore } from '@context/userStore'

import React, { useState } from 'react'
import styles from './index.module.scss' // Import the SCSS module

// Donation input component with user-defined amount
const DonateInput = ({ destinationAddress }) => {
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
    donate(amountAsNumber, destinationAddress)
  }

  return (
    <div className={styles.daoDonateButton}>
      <h4>Donate to DAO Treasury</h4>
      <p>Address: {destinationAddress}</p>
      <input
        type="number"
        value={amount}
        onChange={handleAmountChange}
        placeholder="Enter Number in XTZ"
        inputMode="decimal" // This makes the on-screen keyboard show numbers on mobile
        pattern="[0-9]*" // This allows only numbers to be entered
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

export default DonateInput
