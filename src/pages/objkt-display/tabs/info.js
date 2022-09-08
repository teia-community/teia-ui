import React from 'react'
import { Container, Padding } from '@components/layout'
import { Tags } from '@components/tags'
import styles from '../styles.module.scss'
import '../style.css'
import { HashToURL } from '@utils'
import {
  LANGUAGES,
  LICENSE_TYPES,
  METADATA_CONTENT_RATING_MATURE,
} from '@constants'

/**
 * The Info Tab
 * @function
 * @param {{nft:import('@components/media-types/index').NFT}} props
 * @param {string} viewer_address - The current viewer if logged in.
 * @returns {any}
 */
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
        <div style={{ fontSize: '0.75em' }}>
          <div style={{ margin: '0 1em' }}>
            <hr style={{ color: 'var(--gray-20)', marginBottom: '1em' }} />
            <div style={{ display: 'flex' }}>
              <div>
                <div style={{ marginBottom: '0.5em' }}>
                  <Padding>
                    <strong>Mimetype</strong>:<p>{nft.mime}</p>
                  </Padding>
                </div>
              </div>
              {nft.language && (
                <div style={{ whiteSpace: 'pre-wrap', margin: '0 1em' }}>
                  <strong>Language:</strong>
                  <p>{LANGUAGES[nft.language]}</p>
                </div>
              )}

              {nft.content_rating === METADATA_CONTENT_RATING_MATURE && (
                <div style={{ whiteSpace: 'pre-wrap', margin: '0 1em' }}>
                  <strong>Content Rating:</strong>
                  <p>NSFW (Mature)</p>
                </div>
              )}

              <div style={{ whiteSpace: 'pre-wrap', margin: '0 1em' }}>
                <strong>Rights:</strong>
                <p>
                  {nft.rights ? (
                    nft.rights === 'custom' ? (
                      <a target="_blank" href={nft.right_uri} rel="noreferrer">
                        Custom
                      </a>
                    ) : (
                      LICENSE_TYPES[nft.rights]
                    )
                  ) : (
                    LICENSE_TYPES.none
                  )}
                </p>
              </div>
            </div>
          </div>
          <div style={{ height: '2em' }} />

          <Padding className="tag">
            <div
              style={{
                fontWeight: 'bold',
                whiteSpace: 'pre-wrap',
                margin: '0 1em',
              }}
            >
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
