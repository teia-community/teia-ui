import React, { useContext, useState } from 'react'
import classNames from 'classnames'
import get from 'lodash/get'
import { PATH } from '@constants'
import { Button, Primary, Secondary } from '@atoms/button'
import { TeiaContext } from '@context/TeiaContext'
import { walletPreview } from '@utils/string'
import styles from '@style'
import collabStyles from '../collab/index.module.scss'
// TODO: Properly test collab UIs with loadables
// import { CollabIssuerInfo } from '../collab/show/CollabIssuerInfo'
// import { SigningUI } from '../collab/sign/SigningUI'
// import { SigningSummary } from '../collab/show/SigningSummary'
import { CollaboratorType } from '../collab/constants'
import useSettings from '@hooks/use-settings'
import loadable from '@loadable/component'

const CollabIssuerInfo = loadable(() =>
  import('../collab/show/CollabIssuerInfo')
)
const SigningUI = loadable(() => import('../collab/sign/SigningUI'))
const SigningSummary = loadable(() => import('../collab/show/SigningSummary'))
const CheapestButton = loadable(() => import('./CheapestButton'))
const Editions = loadable(() => import('./Editions'))

/**
 * @param {Object} itemInfoOptions
 * @param {import("@types").NFT} itemInfoOptions.nft
 **/
const ItemInfo = ({ nft }) => {
  const { acc } = useContext(TeiaContext)

  const { walletBlockMap } = useSettings()
  const [showSignStatus, setShowSignStatus] = useState(false)

  const restricted = walletBlockMap.get(nft.artist_address) === 1

  const cheapestListing = nft.listings.filter(
    (listing) => walletBlockMap.get(listing.seller_address) !== 1
  )[0]

  // Check collab status
  const isSigned = get(nft, 'teia_meta.is_signed')
  const isCollab = get(nft, 'artist_profile.is_split')
  const verifiedSymbol = isCollab && isSigned ? '✓ ' : '⚠️'
  const verifiedStatus = isCollab && isSigned ? 'VERIFIED' : 'UNVERIFIED'
  const shareholders = get(
    nft,
    'artist_profile.split_contract.shareholders',
    []
  )
  const isCoreParticipant = isCollab
    ? shareholders.some(
        ({ shareholder_address, holder_type }) =>
          acc?.address === shareholder_address &&
          holder_type === CollaboratorType.CORE_PARTICIPANT
      )
    : false

  // Show the signing UI if required
  const userHasSigned = nft.signatures.find(
    (sig) => sig.shareholder_address === acc?.address
  )
  const coreParticipants = isCollab
    ? shareholders.filter(
        (h) => h.holder_type === CollaboratorType.CORE_PARTICIPANT
      )
    : null

  const signStatusStyles = classNames(
    collabStyles.flexBetween,
    collabStyles.alignStart
  )

  return (
    <>
      <div className={styles.container}>
        <div className={styles.edition}>
          <div className={collabStyles.relative}>
            <div className={styles.inline}>
              {isCollab && <CollabIssuerInfo creator={nft.artist_profile} />}

              {!isCollab && (
                <Button to={`${PATH.ISSUER}/${nft.artist_address}`}>
                  {get(nft, 'artist_profile.name') ? (
                    <Primary>
                      {encodeURI(get(nft, 'artist_profile.name'))}
                    </Primary>
                  ) : (
                    <Primary>{walletPreview(nft.artist_address)}</Primary>
                  )}
                </Button>
              )}
            </div>
          </div>
          <Editions prefix="Editions:" nft={nft} />
        </div>
      </div>

      {/* SHOW SIGNING UI IF COLLABORATOR */}
      {isCollab && isCoreParticipant && !userHasSigned && (
        <div className={styles.container} style={{ paddingTop: 0 }}>
          <SigningUI id={nft.token_id} hasSigned={false} />
        </div>
      )}

      {!restricted && (
        <div className={`${styles.spread} ${styles.objkt_details_container}`}>
          <div className={styles.objkt_label_container}>
            <p className={styles.objkt_label}>OBJKT#{nft.token_id}</p>
            {isCollab && (
              <div className={collabStyles.relative}>
                <div className={styles.collab_verification_title}>
                  <span className={styles.collab_verification_symbol}>
                    {verifiedSymbol}
                  </span>
                  <Button onClick={() => setShowSignStatus(!showSignStatus)}>
                    <Primary>
                      <strong>{verifiedStatus}</strong>
                    </Primary>
                  </Button>
                </div>
                {showSignStatus && (
                  <div className={collabStyles.collabInfo}>
                    <div className={signStatusStyles}>
                      <SigningSummary
                        coreParticipants={coreParticipants}
                        signatures={nft.signatures}
                      />
                      <Button onClick={() => setShowSignStatus(false)}>
                        <Secondary>close</Secondary>
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          <CheapestButton listing={cheapestListing} />
        </div>
      )}
    </>
  )
}
export default ItemInfo
