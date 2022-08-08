import React from 'react'
import Markdown from 'markdown-to-jsx'
import { Container, Padding } from '../../layout'
const axios = require('axios')

export const MD = ({ artifactUri, previewUri }) => {
  const [content, setContent] = React.useState('')

  React.useEffect(() => {
    if (artifactUri) {
      const artifactHash = artifactUri.split('/ipfs/')[1]
      axios
        .get(`https://cloudflare-ipfs.com/ipfs/${artifactHash}`)
        .then((res) => {
          setContent(res.data)
        })
    } else if (previewUri) {
      if (previewUri.startsWith('data:text/markdown;base64,')) {
        const base64_md = previewUri.replace('data:text/markdown;base64,', '')
        setContent(atob(base64_md))
      } else {
        console.error('previewUri is not a base64 encoded markdown', previewUri)
      }
    }
  }, [artifactUri, previewUri])

  return (
    <div>
      <Container>
        <Padding>
          <Markdown>{content}</Markdown>
        </Padding>
      </Container>
    </div>
  )
}
