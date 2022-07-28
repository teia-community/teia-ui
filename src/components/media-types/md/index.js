import React from 'react'
import Markdown from 'markdown-to-jsx'
import { Container, Padding } from '../../layout'
import styles from './styles.module.scss'
const axios = require('axios')

export const MD = ({ artifactUri, displayView, blur }) => {
  const [content, setContent] = React.useState('')

  React.useEffect(() => {
    let artifactHash = artifactUri.split('/ipfs/')[1]
    axios
      .get(`https://cloudflare-ipfs.com/ipfs/${artifactHash}`)
      .then((res) => {
        console.log(res)
        setContent(res.data)
      })
  }, [artifactUri])

  return (
    <div className={`${blur ? styles.blur : ''}`}>
      <Container>
        <Padding>
          <Markdown>{content}</Markdown>
        </Padding>
      </Container>
    </div>
  )
}
