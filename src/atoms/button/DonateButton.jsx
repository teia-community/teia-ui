import React, { useState } from 'react'
import { NetworkType } from '@airgap/beacon-dapp'
import { TezosToolkit } from '@taquito/taquito'
import { BeaconWallet } from '@taquito/beacon-wallet'
import styles from './index.module.scss' // Import the SCSS module

// Initialize the Tezos toolkit and Beacon wallet
const tezos = new TezosToolkit('https://mainnet.api.tez.ie')

let wallet

if (typeof window !== 'undefined') {
  // This block will only run in the browser
  wallet = new BeaconWallet({ name: 'Tezos Donation' })
  tezos.setWalletProvider(wallet)
}

const donate = async (amount, destinationAddress) => {
  try {
    // Request permissions with the correct network type
    await wallet.requestPermissions({
      network: { type: NetworkType.MAINNET },
    })

    // Create a transfer operation
    const operation = await tezos.wallet
      .transfer({
        to: destinationAddress, // Use the passed destination address
        amount: amount, // Amount in XTZ
      })
      .send()

    console.log(`Waiting for ${operation.opHash} to be confirmed...`)

    // Wait for confirmation
    await operation.confirmation(1)

    console.log(`Donation successful with ${operation.opHash}`)
  } catch (error) {
    console.error('Donation failed:', error)
  }
}

// Donation input component with user-defined amount
const DonateInput = ({ destinationAddress }) => {
  const [amount, setAmount] = useState('')

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
