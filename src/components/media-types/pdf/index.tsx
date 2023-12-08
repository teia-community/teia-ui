import { memo, } from 'react'
import { MediaTypeProps } from '@types'
import { ImageComponent } from '../image'
import classnames from 'classnames'
import styles from '@style'

export const PdfComponent = memo(function ({
  artifactUri,
  displayUri,
  previewUri,
  displayView,
  nft,
}: MediaTypeProps) {

  const classes = classnames({
    [styles.container]: true,
    [styles.interactive]: displayView,
    [styles.display]: displayView,
  })


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
    <div className={classes}>
      <iframe
        title={`PDF ${nft.token_id}`}
        src={import.meta.env.VITE_IFRAME_URL + `/pdf/?pdfSrc=${artifactUri}`}
      />
    </div>
  )
})

export default PdfComponent
