import { useState } from 'react'
import { Page, Container } from '@atoms/layout'
import Markdown from 'markdown-to-jsx'

export const PrivacyPolicy = () => {
  const [terms, setTerms] = useState('')

  const document = `src/lang/en/privacypolicy.md`
  fetch(document)
    .then((response) => response.text())
    .then((text) => {
      setTerms(text)
    })

  return (
    <Page title="terms" large>
      <Container>
        {terms && (
          <Markdown options={{ forceBlock: true }} className="markdown-doc">
            {terms}
          </Markdown>
        )}
      </Container>
    </Page>
  )
}
