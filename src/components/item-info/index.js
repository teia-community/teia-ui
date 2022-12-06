import React, { useContext, useState } from 'react'
import classNames from 'classnames'
import sum from 'lodash/sum'
import get from 'lodash/get'
import { PATH } from '../../constants'
import { Button, Primary, Purchase, Secondary } from '../button'
import { HicetnuncContext } from '../../context/HicetnuncContext'
import { walletPreview } from '../../utils/string'
import styles from './styles.module.scss'
import collabStyles from '../collab/styles.module.scss'
import { CollabIssuerInfo } from '../collab/show/CollabIssuerInfo'
import { SigningUI } from '../collab/sign/SigningUI'
import { SigningSummary } from '../collab/show/SigningSummary'
import { CollaboratorType } from '../collab/constants'
import { MarketplaceLabel } from '../listings/marketplace-labels'
import useSettings from 'hooks/use-settings'

export const ItemInfo = ({ nft }) => {
  const { syncTaquito, collect, acc } = useContext(HicetnuncContext)

  const { walletBlockMap } = useSettings()
  const [showSignStatus, setShowSignStatus] = useState(false)
  const restricted = walletBlockMap.get(nft.artist_address) === 1

  const editionsForSale = sum(
    nft.listings
      .filter((listing) => walletBlockMap.get(listing.seller_address) !== 1)
      .map(({ amount_left }) => amount_left)
  )
  const ed = editionsForSale || 'X'
  let purchaseButton = null

  const cheapestListing = nft.listings.filter(
    (listing) => walletBlockMap.get(listing.seller_address) !== 1
  )[0]
  // listings are sorted by price
  // filterering restricted here like this because restricted listing should stay in listings for labeling them as such

  purchaseButton = cheapestListing ? (
    <div className={styles.main_swap}>
      <MarketplaceLabel listing={cheapestListing} />

      <Button
        onClick={() => {
          if (acc == null) {
            syncTaquito()
          } else {
            collect(cheapestListing)
          }
        }}
        full
      >
        <Purchase>
          Collect for {Number(cheapestListing.price) / 1000000} tez
        </Purchase>
      </Button>
    </div>
  ) : (
    <Button full>
      <Purchase>Not for sale</Purchase>
    </Button>
  )

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

          <div>
            <p>
              <span>
                Editions:
                <span>
                  {ed}/{nft.editions}
                </span>
              </span>
            </p>
          </div>
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
          {purchaseButton}
        </div>
      )}
    </>
  )
}

export const ItemInfoCompact = ({ nft }) => {
  return (
    <div className={styles.container}>
      <div className={styles.edition}>
        <div className={styles.inline}>
          <Button
            to={
              get(nft, 'artist_profile.name')
                ? `/${get(nft, 'artist_profile.name')}`
                : `/tz/${nft.artist_address}`
            }
          >
            {get(nft, 'artist_profile.name') ? (
              <Primary>{encodeURI(get(nft, 'artist_profile.name'))}</Primary>
            ) : (
              <Primary>{walletPreview(nft.artist_address)}</Primary>
            )}
          </Button>
        </div>
        <div className={styles.objktContainer}>
          <Button to={`${PATH.OBJKT}/${nft.token_id}`}>
            <Primary label={`object ${nft.token_id}`}>
              OBJKT#{nft.token_id}
            </Primary>
          </Button>
        </div>
      </div>
    </div>
  )
}
