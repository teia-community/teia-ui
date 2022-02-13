import React, { Component } from 'react'
import { Page, Container, Padding } from '../../components/layout'
import { HicetnuncContext } from '../../context/HicetnuncContext'
import { getLanguage } from '../../constants'

import Markdown from 'markdown-to-jsx';

export class Terms extends Component {
  static contextType = HicetnuncContext

  language = getLanguage()

  docLang = 'en'

  // load public\languages\documents\terms-en.md based on language
  componentDidMount() {
    this.loadDocument()
  }

  // load public\languages\documents\terms-en.md based on language
  componentDidUpdate(prevProps) {
    if (this.props.docLang !== prevProps.docLang) {
      this.loadDocument()
    }
  }

  loadDocument() {
    const docLang = this.docLang
    const document = `/languages/documents/terms-${docLang}.md`
    fetch(document)
      .then(response => response.text())
      .then(text => {
        this.termsContent = text
        this.forceUpdate()
      })
  }

  state = {
    reveal: false,
  }

  reveal = () => {
    this.setState({
      reveal: !this.state.reveal,
    })
  }

  render() {
    return (
      <Page title="terms" large>
        <Container>
          <Padding>
            {this.termsContent && (
              <Markdown options={{ forceBlock: true }} className="markdown-doc">{this.termsContent}</Markdown>
            )}
          </Padding>
        </Container>
      </Page>
    )
  }
}
