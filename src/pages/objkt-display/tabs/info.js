import React from 'react'
import { Container } from '@atoms/layout'
import { Tags } from '@components/tags'
import styles from '@style'
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
 * @param {{nft:import('@types').NFT}} props
 * @param {string} viewer_address - The current viewer if logged in.
 * @returns {any}
 */
export const Info = ({ nft, viewer_address }) => {
  const artifact_ipfs_url =
    HashToURL(nft.artifact_uri) +
    `/?creator=${nft.artist_address}&viewer=${viewer_address || ''}&objkt=${
      nft.token_id
    }`
  const metadata_ipfs_url = HashToURL(nft.metadata_uri)
  return (
    <>
      <Container>
        <div className={styles.infos_container}>
          <div className={styles.basic_infos}>
            <h1>{nft.name}</h1>

            <p>{nft.description}</p>
          </div>
          {nft.tags?.length ? (
            <Tags tags={nft.tags.map(({ tag }) => tag)} />
          ) : null}
        </div>
      </Container>
      <span className="line-horizontal" />
      <Container>
        <div className={styles.infos_attributes_container}>
          <div className={styles.infos_attributes_flex}>
            <div className={styles.info_attributes}>
              Mimetype:<p>{nft.mime_type}</p>
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
              <p>{getWordDate(nft.minted_at)}</p>
            </div>
          </div>

          <div className={styles.info_ipfs}>
            <a href={metadata_ipfs_url}>Metadata</a>
            {' // '}
            <a href={artifact_ipfs_url}>View on ipfs</a>
          </div>
        </div>
      </Container>
    </>
  )
}
