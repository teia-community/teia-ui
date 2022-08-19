import React from 'react'
import Markdown from 'markdown-to-jsx'
import { Container, Padding } from '../../layout'
import { Button } from '../../button'
import { VisuallyHidden } from '../../visually-hidden'
import styles from './styles.module.scss'
const axios = require('axios')

export const MD = ({
  displayView,
  displayUri,
  artifactUri,
  previewUri,
  preview,
}) => {
  const [content, setContent] = React.useState('')

  React.useEffect(() => {
    if (artifactUri) {
      // const artifactHash = artifactUri.split('/ipfs/')[1]
      axios
        .get(artifactUri)
        // .get(`https://cloudflare-ipfs.com/ipfs/${artifactHash}`)
        .then((res) => {
          setContent(res.data)
        })
    }

    if (preview && previewUri) {
      if (previewUri.startsWith('data:text/markdown;base64,')) {
        const base64_md = previewUri.replace('data:text/markdown;base64,', '')
        setContent(atob(base64_md))
      } else {
        console.error('previewUri is not a base64 encoded markdown', previewUri)
      }
    }
  }, [artifactUri, previewUri, displayView, displayUri, preview])

  return displayView ? (
    <div className={styles.container}>
      <div className={styles.preview}>
        <img src={displayUri} alt="display" />
        <div className={styles.button}>
          <Button>
            <VisuallyHidden>View</VisuallyHidden>
          </Button>
        </div>
      </div>
    </div>
  ) : (
    <div>
      <Container>
        <Padding>
          <Markdown>{content}</Markdown>
        </Padding>
      </Container>
    </div>
  )
}
