import { memo, } from 'react'
import { MediaTypeProps } from '@types'
import { ImageComponent } from '../image'

export const PdfComponent = memo(function ({
  artifactUri,
  displayUri,
  previewUri,
  displayView,
  nft,
}: MediaTypeProps) {
  const cover = (
    <>
      <ImageComponent
        key={`img-${nft.token_id}`}
        artifactUri={displayUri}
        displayUri={displayUri}
        previewUri={previewUri}
        displayView={false}
        nft={nft}
      />
    </>
  )
  if (!displayView) return cover
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
