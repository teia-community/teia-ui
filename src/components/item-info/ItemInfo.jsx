import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import classNames from 'classnames'
import get from 'lodash/get'
import { PATH } from '@constants'
import { Button, Secondary } from '@atoms/button'
import { useUserStore } from '@context/userStore'
import { useMyInbox, findDmWith } from '@data/messaging/channels'
import CreateDmModal from '@components/channels/CreateDmModal'

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
  const navigate = useNavigate()
  const { data: inbox } = useMyInbox(address)
  const [showDmModal, setShowDmModal] = useState(false)

  const { walletBlockMap } = useSettings()
  const [showSignStatus, setShowSignStatus] = useState(false)

  // Message the artist (non-collab tokens only)
  const canMessageArtist =
    address &&
    nft.artist_address &&
    address !== nft.artist_address &&
    !get(nft, 'artist_profile.is_split')

  const existingDm = useMemo(
    () => findDmWith(inbox, nft.artist_address),
    [inbox, nft.artist_address]
  )

  const handleMessageClick = () => {
    if (existingDm) {
      navigate(`/inbox/channels/${existingDm.id}`)
    } else {
      setShowDmModal(true)
    }
  }

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
                      ? encodeURI(`/${nft.artist_profile.name}`)
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
            {canMessageArtist && (
              <Button
                shadow_box
                onClick={handleMessageClick}
                alt="Message the artist"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  style={{
                    fill: 'var(--text-color)',
                    stroke: 'transparent',
                    marginRight: '8px',
                  }}
                >
                  <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17L4 17.17V4h16v12z" />
                </svg>
                Message
              </Button>
            )}
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

      <CreateDmModal
        isOpen={showDmModal}
        onClose={() => setShowDmModal(false)}
        inbox={inbox}
        initialRecipient={{
          address: nft.artist_address,
          name: nft.artist_profile?.name,
        }}
      />
    </>
  )
}
export default ItemInfo
