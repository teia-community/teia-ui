import { useCallback, useEffect, useState } from 'react'
import { Page, Container } from '@atoms/layout'

import Markdown from 'markdown-to-jsx'
import useLanguage from '@hooks/use-language'

export const Terms = () => {
  // eslint-disable-next-line no-unused-vars
  const { language } = useLanguage()
  const [terms, setTerms] = useState('')

  const loadDocument = useCallback(() => {
    const document = `/languages/documents/terms-${language}.md`
    fetch(document)
      .then((response) => response.text())
      .then((text) => {
        setTerms(text)
        // this.forceUpdate()
      })
  }, [language])

  useEffect(() => {
    loadDocument()
  }, [loadDocument])

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
