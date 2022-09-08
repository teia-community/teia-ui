import React, { useContext, useState } from 'react'
import styles from './styles.module.scss'
import { Document, Page } from 'react-pdf/dist/esm/entry.webpack5'
import 'react-pdf/dist/esm/Page/AnnotationLayer.css'

import { ImageComponent } from '../image'
import { Button, Primary } from '../../button'
import { HicetnuncContext } from '@context/HicetnuncContext'
import { AnimatePresence } from 'framer-motion'
// pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`

const options = {
  cMapUrl: 'cmaps/',
  cMapPacked: true,
  standardFontDataUrl: 'standard_fonts/',
}

export const PdfComponent = ({
  artifactUri,
  fallbackUri,
  displayUri,
  previewUri,
  preview,
  onDetailView,
  nft,
}) => {
  const [numPages, setNumPages] = useState(null)
  const [pageNumber, setPageNumber] = useState(1)
  const [loading, setLoading] = useState(true)
  const context = useContext(HicetnuncContext)

  function onDocumentLoadSuccess({ numPages }) {
    setNumPages(numPages)
    setLoading(false)
  }
  function onDocumentLoadError(e) {
    console.error(e.message)
    context.showFeedback(`${e.message}

see it on [IPFS](${fallbackUri})`)
    setLoading(false)
  }

  function changePage(offset) {
    setPageNumber((prevPageNumber) => prevPageNumber + offset)
  }

  function previousPage() {
    changePage(-1)
  }

  function nextPage() {
    changePage(1)
  }

  function onItemClick(item) {
    setPageNumber(item.pageNumber)
  }

  return (
    <>
      <div className={styles.container}>
        <Document
          file={preview ? previewUri : artifactUri}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={onDocumentLoadError}
          onItemClick={onItemClick}
          title={`PDF object ${nft.id}`}
          className={`${loading && styles.hidden}`}
          options={options}
        >
          <Page pageNumber={pageNumber} />
          {onDetailView && (
            <div className={styles.pdfNav}>
              <Button disabled={pageNumber <= 1} onClick={previousPage}>
                <Primary>Prev «</Primary>
              </Button>
              <p>
                Page {pageNumber || (numPages ? 1 : '--')} of {numPages || '--'}
              </p>
              <Button disabled={pageNumber >= numPages} onClick={nextPage}>
                <Primary>» Next</Primary>
              </Button>
            </div>
          )}
        </Document>
      </div>
      {loading && (
        <AnimatePresence>
          <ImageComponent
            key={`img-${nft.id}`}
            artifactUri={displayUri}
            displayUri={displayUri}
            previewUri={previewUri}
            onDetailView={onDetailView}
            preview={preview}
            displayView={!onDetailView}
            nft={nft}
          />
          <p
            key={`loading-${nft.id}`}
            style={{ textAlign: 'center', margin: '1em' }}
          >
            Loading PDF...
          </p>
        </AnimatePresence>
      )}
    </>
  )
}
