import { memo, } from 'react'
import { MediaTypeProps } from '@types'

export const PdfComponent = memo(function ({
  artifactUri,
  nft
}: MediaTypeProps) {
  return (
    <div>
      <iframe
        title={`PDF ${nft.token_id}`}
        src={import.meta.env.VITE_IFRAME_URL + `/pdf/?pdfSrc=${artifactUri}`}
        height={'500vh'}
        width={'500vw'}
      />
    </div>
  )
})

export default PdfComponent
