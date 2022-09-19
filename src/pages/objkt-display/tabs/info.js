import React, { useMemo } from 'react'
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
import { getWordDate } from '@utils/time'

/**
 * The Info Tab
 * @function
 * @param {{nft:import('@components/media-types/index').NFT}} props
 * @param {string} viewer_address - The current viewer if logged in.
 * @returns {any}
 */
export const Info = ({ nft, viewer_address }) => {
  const artifact_ipfs_url = useMemo(
    () =>
      HashToURL(nft.artifact_uri) +
      `/?creator=${nft.creator.address}&viewer=${viewer_address || ''}&objkt=${
        nft.id
      }`,
    [nft, viewer_address]
  )
  const metadata_ipfs_url = useMemo(() => HashToURL(nft.metadata), [nft])

  return (
    <>
      <div className={styles.infos_attributes_container}>
        <Container>
          <div className={styles.objkt__title}>{nft.title}</div>
        </Container>

        <Container>
          <div style={{ whiteSpace: 'pre-wrap' }}>{nft.description}</div>
        </Container>

        <Container>
          <Tags token_tags={nft.token_tags} />
        </Container>
      </div>

      <Container>
        <div className={styles.infos_attributes_container}>
          <hr style={{ color: 'var(--gray-20)', marginBottom: '1em' }} />
          <div className={styles.infos_attributes_flex}>
            <div className={styles.info_attributes}>
              Mimetype:<p>{nft.mime}</p>
            </div>
            {nft.language && (
              <div className={styles.info_attributes}>
                Language:<p>{LANGUAGES[nft.language]}</p>
              </div>
            )}
            {nft.content_rating && (
              <div className={styles.info_attributes}>
                Content Rating:
                {nft.content_rating === METADATA_CONTENT_RATING_MATURE ? (
                  <p>NSFW (Mature)</p>
                ) : (
                  <p>Unknown Rating</p>
                )}
              </div>
            )}

            <div className={styles.info_attributes}>
              Rights:
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

            <div className={styles.info_attributes}>
              Mint date:
              <p>{getWordDate(nft.timestamp)}</p>
            </div>
          </div>
          <Padding>
            <div className={styles.info_ipfs}>
              <a href={metadata_ipfs_url}>Metadata</a>
              {' // '}
              <a href={artifact_ipfs_url}>View on ipfs</a>
            </div>
          </Padding>
        </div>
      </Container>
    </>
  )
}
