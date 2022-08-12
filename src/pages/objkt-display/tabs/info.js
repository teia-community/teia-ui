import React from 'react'
import { Container, Padding } from '@components/layout'
import { Tags } from '@components/tags'
import styles from '../styles.module.scss'
import '../style.css'
import { HashToURL } from '@utils/index'

export const Info = (token_info) => {
  const {
    address,
    title,
    creator,
    id,
    description,
    metadata,
    token_tags,
    mime,
    artifact_uri,
  } = token_info

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
            {title}
          </div>
        </Padding>
      </Container>

      <Container>
        <Padding>
          <div style={{ whiteSpace: 'pre-wrap', margin: '0 1em' }}>
            {description}
          </div>
        </Padding>
      </Container>

      <Container>
        <Padding>
          <Tags token_tags={token_tags} />
        </Padding>
      </Container>

      <Container>
        <div style={{ margin: '0 1em' }}>
          <hr style={{ color: 'var(--gray-20)', marginBottom: '1em' }} />
          <div style={{ marginBottom: '0.5em' }}>
            <Padding>Mimetype: {mime}</Padding>
          </div>
          <Padding className="tag">
            <div style={{ fontWeight: 'bold' }}>
              <a style={tag} href={HashToURL(metadata, 'IPFS')}>
                Metadata
              </a>
              &nbsp;//&nbsp;
              <a
                style={tag}
                href={
                  HashToURL(artifact_uri, 'IPFS') +
                  `/?creator=${creator.address}&viewer=${
                    address || ''
                  }&objkt=${id}`
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
