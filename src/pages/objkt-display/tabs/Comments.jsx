import { Container } from '@atoms/layout'
import { TokenComments } from '@components/token-comments'
import { useObjktDisplayContext } from '..'

/**
 * The Comments Tab
 * @function
 * @returns {any}
 */
export const Comments = () => {
  const { nft, viewer_address } = useObjktDisplayContext()

  const isHolder = Boolean(
    viewer_address &&
      nft?.holdings?.some(
        (h) => h.holder_address === viewer_address && parseInt(h.amount) > 0
      )
  )

  return (
    <Container>
      <TokenComments
        fa2Address={nft.fa2_address}
        tokenId={String(nft.token_id)}
        isHolder={isHolder}
      />
    </Container>
  )
}
