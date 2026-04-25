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
}) {
  const [amount, setAmount] = useState('')
  const [price, setPrice] = useState('')
  const [address, swap] = useUserStore((st) => [st.address, st.swap])
  const show = useModalStore((st) => st.show)
  const [progress] = useModalStore((st) => [st.progress])

  const handleSubmit = async () => {
    if (!amount) {
      show(`Please enter an OBJKT quantity to swap (current value: ${amount})`)
      return
    }
    if (price == null || price < 0) {
      show(`Please enter a price for the swap (current value: ${price})`)
      return
    }
    // Same scale as Swap tab (`nft.royalties_total / 1000`) and mint_OBJKT (`royalties * 10`).
    await swap(
      address,
      Number(royaltiesPercent) * 10,
      parseFloat(price) * 1e6,
      String(tokenId),
      minterAddress,
      parseFloat(amount)
    )
    useMintStore.getState().reset()
  }

  return (
    <div style={{ marginTop: '1rem', textAlign: 'left' }}>
      <p>
        You own {editions} edition{editions !== 1 ? 's' : ''} of OBJKT#
        {tokenId}. How many editions would you like to swap?
      </p>
      <div style={{ marginTop: '1rem' }}>
        <Input
          type="number"
          label="Quantity"
          name="post-mint-quantity"
          placeholder="OBJKT quantity"
          min={1}
          value={amount}
          onChange={(v) => setAmount(String(v ?? ''))}
          onBlur={() => {
            setAmount((prev) => String(clampSwapAmountOnBlur(prev, editions)))
          }}
          disabled={progress}
        />
      </div>
      <Input
        type="number"
        label="Price"
        name="post-mint-price"
        placeholder="Price per OBJKT (XTZ)"
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
      <Button
        shadow_box
        onClick={handleSubmit}
        fit
        disabled={progress}
        style={{ marginTop: 12, marginBottom: 20 }}
      >
        Swap
      </Button>
      <p style={{ marginTop: '1rem', fontSize: '0.9em' }}>
        {SWAP_TEIA_FEE_DISCLOSURE}
      </p>
    </div>
  )
}
