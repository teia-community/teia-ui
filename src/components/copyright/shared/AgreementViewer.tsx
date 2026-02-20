import { useEffect, useState } from 'react'
import Button from '@atoms/button/Button'
import styles from './index.module.scss'
import { fetchAgreementText } from '@data/swr'
import { HashToURL } from '@utils'
import { useOutletContext } from 'react-router'

// Module-level cache: fetched once, shared across all AgreementViewer instances
let cachedAgreementText: Promise<string> | null = null
function getAgreementText(): Promise<string> {
  if (!cachedAgreementText) {
    cachedAgreementText = (async () => {
      const ipfsUri = await fetchAgreementText()
      if (!ipfsUri) return '[No agreement URI found]'
      const url = HashToURL(ipfsUri, 'IPFS')
      const res = await fetch(url)
      if (!res.ok) throw new Error('Failed to fetch from IPFS')
      const json = await res.json()
      return json.document_text || '[No document_text found]'
    })()
  }
  return cachedAgreementText
}

interface AgreementProps {
  firstParagraph: string
}

export default function AgreementViewer(props: AgreementProps) {
  const [agreementText, setAgreementText] = useState('')
  const [loading, setLoading] = useState(true)

  const { address } = useOutletContext() as { address?: string }

  const handlePrint = () => {
    const printContent = document.getElementById('printable-agreement')
    if (!printContent) return

    const now = new Date()
    const formattedDate = now.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
    const formattedTime = now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    })

    const printWindow = window.open('', '_blank')
    printWindow?.document.write(`
      <html>
        <head>
          <title>Copyright Agreement</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; padding: 20px; }
            h1 { font-size: 1.5rem; margin-bottom: 1rem; }
            pre { white-space: pre-wrap; font-family: inherit; }
            .timestamp {
              margin-bottom: 1rem;
              color: #666;
              font-size: 0.9rem;
              border-bottom: 1px solid #eee;
              padding-bottom: 0.5rem;
            }
          </style>
        </head>
        <body>
          <h1>Active Copyright Agreement</h1>
          <div class="timestamp">
            Print Date: ${formattedDate} at ${formattedTime}
            ${address ? `<br />Printed By: ${address}` : ''}
          </div>
          <pre>${printContent.innerText}</pre>
        </body>
      </html>
    `)
    printWindow?.document.close()
    printWindow?.focus()
    setTimeout(() => {
      printWindow?.print()
      printWindow?.close()
    }, 500)
  }

  useEffect(() => {
    getAgreementText()
      .then(setAgreementText)
      .catch(() => setAgreementText('[Error loading agreement text]'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p className={styles.loading}>Loading agreement...</p>

  return (
    <div className={styles.agreement_box}>
      <div className={styles.header_actions}>
        <h1 className={styles.title}>Active Copyright Agreement</h1>
        <div className={styles.action_buttons}>
          <Button
            onClick={handlePrint}
            shadow_box
            fit
            className={styles.print_button}
          >
            Print
          </Button>
        </div>
      </div>
      <div id="printable-agreement" className={styles.agreement_text}>
        {props?.firstParagraph && props.firstParagraph}
        {agreementText}
      </div>
    </div>
  )
}
