import React from 'react'
import { Container, Padding } from '@components/layout'
import { Tags } from '@components/tags'
import styles from '../styles.module.scss'
import '../style.css'
import { HashToURL } from '@utils'

export const Info = ({ nft, viewer_address }) => {
  const tag = {
    '&:hover': {
      textDecoration: 'underline',
    },
    color: 'var(--gray-80)',
  }
  return (
    <>
      <Container>
        <Padding>
          <div
            className={styles.objkt__title}
            style={{
              margin: '0 1em',
            }}
          >
            {nft.title}
          </div>
        </Padding>
      </Container>

      <Container>
        <Padding>
          <div style={{ whiteSpace: 'pre-wrap', margin: '0 1em' }}>
            {nft.description}
          </div>
        </Padding>
      </Container>

      <Container>
        <Padding>
          <Tags token_tags={nft.token_tags} />
        </Padding>
      </Container>

      <Container>
        <Padding>
          <p>{JSON.stringify(nft)}</p>
        </Padding>
      </Container>

      <Container>
        <div style={{ margin: '0 1em' }}>
          <hr style={{ color: 'var(--gray-20)', marginBottom: '1em' }} />
          <div style={{ marginBottom: '0.5em' }}>
            <Padding>Mimetype: {nft.mime}</Padding>
          </div>
          <Padding className="tag">
            <div style={{ fontWeight: 'bold' }}>
              <a style={tag} href={HashToURL(nft.metadata)}>
                Metadata
              </a>
              &nbsp;//&nbsp;
              <a
                style={tag}
                href={
                  HashToURL(nft.artifact_uri) +
                  `/?creator=${nft.creator.address}&viewer=${
                    viewer_address || ''
                  }&objkt=${nft.id}`
                }
              >
                View on ipfs
              </a>
            </div>
          </Padding>
        </div>
      </Container>
    </>
  )
}
