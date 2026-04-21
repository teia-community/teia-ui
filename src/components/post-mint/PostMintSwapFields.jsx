import { useState } from 'react'
import { Input } from '@atoms/input'
import { Button } from '@atoms/button'
import { useModalStore } from '@context/modalStore'
import { useUserStore } from '@context/userStore'
import { useMintStore } from '@context/mintStore'
import {
  SWAP_TEIA_FEE_DISCLOSURE,
  maybeWarnLowSwapPrice,
  clampSwapAmountOnBlur,
  clampSwapPriceOnBlur,
} from '@utils/postMintSwap'

/**
 * Inline listing form after mint (modal footerSlot).
 */
export function PostMintSwapFields({
  tokenId,
  minterAddress,
  editions,
  royaltiesPercent,
  title,
  previewUri,
}) {
  const [amount, setAmount] = useState('')
  const [price, setPrice] = useState('')
  const [currency] = useState('tez')
  const [address, swap] = useUserStore((st) => [st.address, st.swap])
  const show = useModalStore((st) => st.show)
  const [progress] = useModalStore((st) => [st.progress])

  const inputStyle = { width: '75% !important' }

  const handleSubmit = async () => {
    if (!amount) {
      show(`Please enter an OBJKT quantity to swap (current value: ${amount})`)
      return
    }
    if (price == null || price < 0) {
      show(`Please enter a price for the swap (current value: ${price})`)
      return
    }
    if (currency === 'tez') {
      await swap(
        address,
        royaltiesPercent,
        parseFloat(price) * 1e6,
        String(tokenId),
        minterAddress,
        parseFloat(amount)
      )
      useMintStore.getState().reset()
    }
  }

  return (
    <div style={{ marginTop: '1rem', textAlign: 'left' }}>
      {title && (
        <p style={{ marginBottom: '0.5rem' }}>
          <strong>{title}</strong>
        </p>
      )}
      {previewUri && (
        <img
          src={previewUri}
          alt=""
          style={{
            maxWidth: 120,
            maxHeight: 120,
            objectFit: 'contain',
            marginBottom: '0.75rem',
          }}
        />
      )}
      <p>
        You own {editions} edition{editions !== 1 ? 's' : ''} of OBJKT#
        {tokenId}. How many would you like to swap?
      </p>
      <div>
        <Input
          type="number"
          placeholder="OBJKT quantity"
          min={1}
          value={amount}
          onChange={(v) => setAmount(String(v ?? ''))}
          onBlur={() => {
            setAmount((prev) => String(clampSwapAmountOnBlur(prev, editions)))
          }}
          disabled={progress}
        />
        <div style={{ width: '100%', display: 'flex', marginTop: 8 }}>
          <div style={{ width: '90%' }}>
            <Input
              style={inputStyle}
              type="number"
              placeholder="Price per OBJKT"
              value={price}
              initial={0}
              onChange={(v) => setPrice(v === '' ? '' : v)}
              onBlur={() => {
                setPrice((prev) => {
                  const val = clampSwapPriceOnBlur(prev)
                  maybeWarnLowSwapPrice(show, val)
                  return val
                })
              }}
              disabled={progress}
            />
          </div>
          <div>
            <select
              value={currency}
              disabled
              style={{ float: 'right', display: 'inline' }}
              aria-label="Currency"
            >
              <option value="tez">tez</option>
            </select>
          </div>
        </div>
        <Button
          shadow_box
          onClick={handleSubmit}
          fit
          disabled={progress}
          style={{ marginTop: 12 }}
        >
          Swap
        </Button>
      </div>
      <p style={{ marginTop: '1rem', fontSize: '0.9em' }}>
        {SWAP_TEIA_FEE_DISCLOSURE}
      </p>
    </div>
  )
}
