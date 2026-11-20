import { memo, useLayoutEffect, useMemo, useRef, useState } from 'react'
import styles from '@style'
import { Document, Page, pdfjs } from 'react-pdf'
import pdfWorkerUrl from 'pdfjs-dist/legacy/build/pdf.worker.min.mjs?url'
import 'react-pdf/dist/Page/TextLayer.css'
import 'react-pdf/dist/Page/AnnotationLayer.css'

import type { PDFPageProxy } from 'pdfjs-dist'
import { ImageComponent } from '@components/media-types/image'
import { Button } from '@atoms/button'
import { MediaTypeProps } from '@types'

pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl

const options = {
  cMapUrl: 'cmaps/',
  cMapPacked: true,
  standardFontDataUrl: 'standard_fonts/',
  // Never let pdf.js eval() code derived from PDF contents
  isEvalSupported: false,
}

function FittedPage({
  pageNumber,
  bounds,
  className,
  onRenderSuccess,
}: {
  pageNumber: number
  bounds: { width: number; height: number }
  className: string
  onRenderSuccess?: () => void
}) {
  const [aspectRatio, setAspectRatio] = useState<number>()

  return (
    <Page
      className={className}
      pageNumber={pageNumber}
      width={
        aspectRatio
          ? Math.min(bounds.width, bounds.height * aspectRatio)
          : bounds.width
      }
      onLoadSuccess={(page: PDFPageProxy) => {
        const viewport = page.getViewport({ scale: 1 })
        setAspectRatio(viewport.width / viewport.height)
      }}
      onRenderSuccess={onRenderSuccess}
    />
  )
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

  const [bounds, setBounds] = useState<{ width: number; height: number }>()

  // const [loading, setLoading] = useState(displayView)

  const container = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const element = container.current
    if (!element) return
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      setBounds({ width, height })
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [displayView, showDocument])

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
    }
    setRenderedPageNumber(pageNumber)
  }

  function onPassword(callback: (password: string) => void, reason: number) {
    function callbackProxy(password: string | null) {
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
    <div className={styles.container}>
      {!showDocument ? (
        <Button
          onClick={() => {
            setShowDocument(true)
          }}
        >
          Reload PDF with password
        </Button>
      ) : (
        <div className={styles.stage} ref={container}>
          <Document
            file={file}
            loading={cover}
            onPassword={onPassword}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            options={options}
          >
            {bounds &&
              renderedPageNumber &&
              renderedPageNumber !== pageNumber && (
                <FittedPage
                  key={`${renderedPageNumber}`}
                  className={styles.previous_page}
                  pageNumber={renderedPageNumber}
                  bounds={bounds}
                />
              )}
            {bounds && bounds.width > 0 && (
              <FittedPage
                key={pageNumber}
                className={styles.page}
                pageNumber={pageNumber}
                onRenderSuccess={onRender}
                bounds={bounds}
              />
            )}
          </Document>
        </div>
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
