import { memo, useMemo, useRef, useState } from 'react'
import styles from '@style'
import { Document, Page } from 'react-pdf/dist/esm/entry.vite'
import 'react-pdf/dist/esm/Page/TextLayer.css'
import 'react-pdf/dist/esm/Page/AnnotationLayer.css'

import { ImageComponent } from '../image'
import { Button } from '@atoms/button'
import { MediaTypeProps } from '@types'
// pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`
// pdfjs.GlobalWorkerOptions.workerSrc = 'pdf.worker.min.js'
const options = {
  cMapUrl: 'cmaps/',
  cMapPacked: true,
  standardFontDataUrl: 'standard_fonts/',
}

export const PdfComponent = memo(function ({
  artifactUri,
  displayUri,
  previewUri,
  displayView,
  nft,
}: MediaTypeProps) {
  const [numPages, setNumPages] = useState<number>()
  const [pageNumber, setPageNumber] = useState(1)
  const [renderedPageNumber, setRenderedPageNumber] = useState<number>()
  const [loading, setLoading] = useState(displayView)
  const [showDocument, setShowDocument] = useState(true)

  const [height, setHeight] = useState<number>()

  // const [loading, setLoading] = useState(displayView)

  const container = useRef<HTMLDivElement>(null)

  const file = useMemo(
    () => (previewUri ? previewUri : artifactUri),
    [previewUri, artifactUri]
  )

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages)
  }

  function onDocumentLoadError(e: Error) {
    console.error(`PDF Error: ${e.message}`)
  }

  function changePage(offset: number) {
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
      setHeight(container.current?.clientHeight)
    }
    setRenderedPageNumber(pageNumber)
  }

  function onPassword(callback, reason) {
    function callbackProxy(password) {
      // Cancel button handler
      if (password === null) {
        // password will be null if user clicks on cancel
        setShowDocument(false)
        return
      }
      callback(password)
    }

    switch (reason) {
      case 1: {
        const password = prompt('Enter the password to open this PDF file.')
        callbackProxy(password)
        break
      }
      case 2: {
        const password = prompt('Invalid password. Please try again.')
        callbackProxy(password)
        break
      }
      default:
    }
  }

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
      {loading && (
        <p
          key={`loading-${nft.token_id}`}
          style={{ textAlign: 'center', margin: '1em' }}
        >
          Loading PDF...
        </p>
      )}
    </>
  )
  // console.log({
  //   pageNumber,
  //   renderedPageNumber,
  // })
  // const loading = renderedPageNumber !== pageNumber
  if (!displayView) return cover

  return (
    <div ref={container} className={styles.container}>
      {!showDocument ? (
        <Button
          onClick={() => {
            setShowDocument(true)
          }}
        >
          Reload PDF with password
        </Button>
      ) : (
        <Document
          file={file}
          loading={cover}
          onPassword={onPassword}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={onDocumentLoadError}
          title={`PDF object ${nft.token_id}`}
          options={options}
        >
          {renderedPageNumber && renderedPageNumber !== pageNumber && (
            <Page
              key={`${renderedPageNumber}`}
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
      )}
      {!loading && showDocument && (
        <div className={styles.pdfNav}>
          <Button disabled={pageNumber <= 1} onClick={previousPage}>
            {'Prev «'}
          </Button>
          <p>
            Page {pageNumber || (numPages ? 1 : '--')} of {numPages || '--'}
          </p>
          <Button
            disabled={numPages ? pageNumber >= numPages : false}
            onClick={nextPage}
          >
            {'>» Next'}
          </Button>
        </div>
      )}
    </div>
  )
})

export default PdfComponent
