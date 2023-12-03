import { memo, } from 'react'
import { MediaTypeProps } from '@types'

export const PdfComponent = memo(function ({
  artifactUri
}: MediaTypeProps) {
  return (
    <iframe
      src={import.meta.env.VITE_IFRAME_URL + `/pdf/?pdfSrc=${artifactUri}`}
      height={'1000vh'}
      width={'1000vw'}
    />
  )
})

export default PdfComponent
