import React, { useContext, useMemo, useState } from 'react'
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

export const ItemInfo = ({
  id,
  listings,
  creator,
  is_signed,
  token_signatures,
  feed,
  supply,
}) => {
  const { syncTaquito, collect, fulfillObjktcomAsk, acc } =
    useContext(HicetnuncContext)

  const { walletBlockMap } = useSettings()

  const [showSignStatus, setShowSignStatus] = useState(false)
  const restricted = useMemo(
    () => walletBlockMap.get(creator.address) === 1,
    [walletBlockMap, creator]
  )

  // TODO: subtract burned pieces from total
  const total = supply
  const editionsForSale = sum(
    listings
      .filter(
        (listing) =>
          walletBlockMap.get(
            listing.seller_address
              ? listing.seller_address
              : listing.creator.address
          ) !== 1
      )
      .map(({ amount_left }) => amount_left)
  )
  const ed = editionsForSale || 'X'
  let purchaseButton = null

  const cheapestListing = listings.filter(
    (listing) => walletBlockMap.get(listing.creator_id) !== 1
  )[0]
  // listings are sorted by price
  // filterering restricted here like this because restricted listing should stay in listings for labeling them as such

  purchaseButton = cheapestListing ? (
    <div className={styles.main_swap}>
      <MarketplaceLabel swap={cheapestListing} />

      <Button
        onClick={() => {
          if (acc == null) {
            syncTaquito()
          } else {
            if (cheapestListing.type === 'swap') {
              collect(
                cheapestListing.contract_address,
                cheapestListing.id,
                cheapestListing.price * 1
              )
            } else {
              fulfillObjktcomAsk(cheapestListing)
            }
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
  const isCollab = creator.is_split
  const verifiedSymbol = isCollab && is_signed ? '✓ ' : '⚠️'
  const verifiedStatus = isCollab && is_signed ? 'VERIFIED' : 'UNVERIFIED'
  const isCoreParticipant = isCollab
    ? creator.shares[0].shareholder.find((h) => h.holder_id === acc?.address)
    : false

  // Show the signing UI if required
  const userHasSigned = token_signatures.find(
    (sig) => sig.holder_id === acc?.address
  )
  const coreParticipants = isCollab
    ? creator.shares[0].shareholder.filter(
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
              {isCollab && <CollabIssuerInfo creator={creator} />}

              {!isCollab && (
                <Button to={`${PATH.ISSUER}/${creator.address}`}>
                  {creator.name ? (
                    <Primary>{encodeURI(creator.name)}</Primary>
                  ) : (
                    <Primary>{walletPreview(creator.address)}</Primary>
                  )}
                </Button>
              )}
            </div>
          </div>

          {!feed && (
            <div>
              <p>
                <span>
                  Editions:
                  <span>
                    {ed}/{total}
                  </span>
                </span>
              </p>
            </div>
          )}
        </div>

        {feed && (
          <div className={styles.objktContainer}>
            <Button to={`${PATH.OBJKT}/${id}`} disabled>
              <Primary label={`object ${id}`}>OBJKT#{id}</Primary>
            </Button>
          </div>
        )}
      </div>

      {/* SHOW SIGNING UI IF COLLABORATOR */}
      {isCollab && isCoreParticipant && !userHasSigned && (
        <div className={styles.container} style={{ paddingTop: 0 }}>
          <SigningUI id={id} hasSigned={false} />
        </div>
      )}

      {!restricted && (
        <div className={`${styles.spread} ${styles.objkt_details_container}`}>
          <div className={styles.objkt_label_container}>
            <p className={styles.objkt_label}>OBJKT#{id}</p>
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
                        signatures={token_signatures}
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
          <Button to={`/tz/${nft.artist_address}`}>
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
