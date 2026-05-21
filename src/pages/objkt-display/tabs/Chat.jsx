import { useObjktDisplayContext } from '..'
import TokenRoom from '@components/token-gate/TokenRoom'

export function Chat() {
  const { nft } = useObjktDisplayContext()

  if (!nft) return null

  return (
    <TokenRoom
      fa2Override={nft.fa2_address}
      tokenIdOverride={String(nft.token_id)}
    />
  )
}
