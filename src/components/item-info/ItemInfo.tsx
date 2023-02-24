import { useState } from 'react'
import classNames from 'classnames'
import get from 'lodash/get'
import { PATH } from '@constants'
import { Button, Secondary } from '@atoms/button'
import { useUserStore } from '@context/userStore'

import { walletPreview } from '@utils/string'
import styles from '@style'
import collabStyles from '../collab/index.module.scss'
import { CollaboratorType } from '@constants'
import useSettings from '@hooks/use-settings'

import SigningUI from '@components/collab/sign/SigningUI'
import SigningSummary from '@components/collab/show/SigningSummary'
import CheapestButton from './CheapestButton'
import CollabIssuerInfo from '@components/collab/show/CollabIssuerInfo'
import Editions from './Editions'
/**
 * @param {Object} itemInfoOptions
 * @param {import("@types").NFT} itemInfoOptions.nft
 **/
const ItemInfo = ({ nft }) => {
  const address = useUserStore((st) => st.address)

  const { walletBlockMap } = useSettings()
  const [showSignStatus, setShowSignStatus] = useState(false)

  const restricted = walletBlockMap.get(nft.artist_address) === 1

  const cheapestListing = nft.listings.find(
    (listing) => walletBlockMap.get(listing.seller_address) !== 1
  )

  // Check collab status
  const isSigned = get(nft, 'teia_meta.is_signed')
  const isCollab = get(nft, 'artist_profile.is_split')
  const verifiedSymbol = isCollab && isSigned ? '✓ ' : '⚠️'
  const verifiedStatus = isCollab && isSigned ? 'VERIFIED' : 'UNVERIFIED'
  const shareholders = nft?.artist_profile?.split_contract?.shareholders || []

  const isCoreParticipant = isCollab
    ? shareholders.some(
        ({ shareholder_address, holder_type }) =>
          address === shareholder_address &&
          holder_type === CollaboratorType.CORE_PARTICIPANT
      )
    : false

  // Show the signing UI if required
  const userHasSigned = nft.signatures.find(
    (sig) => sig.shareholder_address === address
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
      {/* SHOW SIGNING UI IF COLLABORATOR */}
      {isCollab && isCoreParticipant && !userHasSigned && (
        <SigningUI id={nft.token_id} hasSigned={false} />
      )}

      <div className={styles.container}>
        <div className={styles.edition}>
          <div className={collabStyles.relative}>
            <div className={styles.inline}>
              {isCollab ? (
                <CollabIssuerInfo creator={nft.artist_profile} />
              ) : (
                <Button
                  to={
                    nft.artist_profile?.name
                      ? `/${nft.artist_profile.name}`
                      : `${PATH.ISSUER}/${nft.artist_address}`
                  }
                >
                  {nft.artist_profile?.name
                    ? nft.artist_profile.name
                    : walletPreview(nft.artist_address)}
                </Button>
              )}
            </div>
          </div>
          <Editions prefix="Editions:" nft={nft} />
        </div>
      </div>

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
                    {verifiedStatus}
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
