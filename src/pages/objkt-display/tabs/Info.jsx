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
import { Line } from '@atoms/line'
import { useOutletContext } from 'react-router'

const Attribute = ({ label, value }) => {
  return (
    <div className={styles.info_attributes}>
      {label}:<p>{value}</p>
    </div>
  )
}
//TODO(mel) refactor this...
/**
 * The Info Tab
 */
export const Info = () => {
  /** @type {{nft:import('@types').NFT}} */
  const { nft, viewer_address } = useOutletContext()
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
      <Line />
      <Container>
        <div className={styles.infos_attributes_container}>
          <div className={styles.infos_attributes_flex}>
            <Attribute label="Mimetype" value={nft.mime_type} />
            {nft.language && (
              <Attribute label="Language" value={LANGUAGES[nft.language]} />
            )}
            {(nft.teia_meta.content_rating || nft.isNSFW) && (
              <Attribute
                label="Content Rating"
                value={
                  nft.content_rating === METADATA_CONTENT_RATING_MATURE ||
                  nft.isNSFW
                    ? 'NSFW (Mature)'
                    : 'Unknown Rating'
                }
              />
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
