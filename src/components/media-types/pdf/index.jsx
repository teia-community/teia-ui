import { memo, useMemo, useRef, useState } from 'react'
import styles from '@style'
import { Document, Page, pdfjs } from 'react-pdf/dist/esm/entry.webpack5'
import 'react-pdf/dist/esm/Page/TextLayer.css'
import 'react-pdf/dist/esm/Page/AnnotationLayer.css'

import { ImageComponent } from '../image'
import { Button } from '@atoms/button'
import { AnimatePresence } from 'framer-motion'
// pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`
pdfjs.GlobalWorkerOptions.workerSrc = 'pdf.worker.min.js'
const options = {
  cMapUrl: 'cmaps/',
  cMapPacked: true,
  standardFontDataUrl: 'standard_fonts/',
}

/**
 * @param {import("@types").MediaTypeProps} renderOptions - Th options for the media renderer
 */
export const PdfComponent = memo(function ({
  artifactUri,
  displayUri,
  previewUri,
  displayView,
  nft,
}) {
  const [numPages, setNumPages] = useState(null)
  const [pageNumber, setPageNumber] = useState(1)
  const [renderedPageNumber, setRenderedPageNumber] = useState(null)
  const [loading, setLoading] = useState(displayView)
  const [pageLoading, setPageLoading] = useState(false)

  const [height, setHeight] = useState(null)
  // const [loading, setLoading] = useState(displayView)

  const container = useRef()

  const file = useMemo(
    () => (previewUri ? previewUri : artifactUri),
    [previewUri, artifactUri]
  )

  function onDocumentLoadSuccess({ numPages }) {
    setNumPages(numPages)
  }

  function onDocumentLoadError(e) {
    throw Error(e.message, { cause: 'PDF Error' })
  }

  function changePage(offset) {
    setPageLoading(true)
    setPageNumber((prevPageNumber) => prevPageNumber + offset)
  }

  function previousPage() {
    changePage(-1)
  }

  function nextPage() {
    changePage(1)
  }

  // function onItemClick(item) {
  //   setPageNumber(item.pageNumber)
  // }

  const onRender = () => {
    if (loading) {
      setLoading(false)
      setHeight(container.current.clientHeight)
    }
    setRenderedPageNumber(pageNumber)
    setPageLoading(false)
  }

  const cover = (
    <AnimatePresence>
      <ImageComponent
        key={`img-${nft.token_id}`}
        artifactUri={displayUri}
        displayUri={displayUri}
        previewUri={previewUri}
        displayView={false}
        nft={nft}
      />
      {loading && (
        <p
          key={`loading-${nft.token_id}`}
          style={{ textAlign: 'center', margin: '1em' }}
        >
          Loading PDF...
        </p>
      )}
    </AnimatePresence>
  )
  // console.log({
  //   pageLoading,
  //   pageNumber,
  //   renderedPageNumber,
  // })
  // const loading = renderedPageNumber !== pageNumber
  if (!displayView) return cover
  return (
    <div ref={container} className={styles.container}>
      <Document
        file={file}
        loading={cover}
        onLoadSuccess={onDocumentLoadSuccess}
        onLoadError={onDocumentLoadError}
        title={`PDF object ${nft.token_id}`}
        options={options}
      >
        {renderedPageNumber && renderedPageNumber !== pageNumber && (
          <Page
            key={`ren-${renderedPageNumber}`}
            className={styles.previous_page}
            pageNumber={renderedPageNumber}
            height={height}
          />
        )}
        <Page
          key={pageNumber}
          className={styles.page}
          pageNumber={pageNumber}
          onRenderSuccess={onRender}
          height={height}
        />
      </Document>
      {!loading && (
        <>
          <div className={styles.pdfNav}>
            <Button disabled={pageNumber <= 1} onClick={previousPage}>
              {'Prev «'}
            </Button>
            <p>
              Page {pageNumber || (numPages ? 1 : '--')} of {numPages || '--'}
            </p>
            <Button disabled={pageNumber >= numPages} onClick={nextPage}>
              {'>» Next'}
            </Button>
          </div>
        </>
      )}
    </div>
  )
})

export default PdfComponent
