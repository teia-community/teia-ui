import React, { useContext, useState } from 'react'
import classNames from 'classnames'
import sum from 'lodash/sum'
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

export const ItemInfo = ({
  id,
  listings,
  creator,
  is_signed,
  token_signatures,
  feed,
  supply,
  isDetailView,
  restricted,
}) => {
  const { syncTaquito, collect, curate, acc } = useContext(HicetnuncContext)

  const [showSignStatus, setShowSignStatus] = useState(false)

  if (isDetailView) {
    // TODO: subtract burned pieces from total
    const total = supply
    const editionsForSale = sum(listings.map(({ amount_left }) => amount_left))
    const ed = editionsForSale || 'X'
    let purchaseButton = null

    const cheapestListing = listings[0] // listings are sorted by price

    if (cheapestListing) {
      if (cheapestListing.type === 'swap') {
        purchaseButton = (
          <Button
            onClick={() => {
              if (acc == null) {
                syncTaquito()
              } else {
                collect(
                  cheapestListing.contract_address,
                  cheapestListing.id,
                  cheapestListing.price * 1
                )
              }
            }}
            full
          >
            <Purchase>
              Collect for {Number(cheapestListing.price) / 1000000} tez
            </Purchase>
          </Button>
        )
      } else {
        // objktcom ask
        purchaseButton = (
          <Button href={`https://objkt.com/asset/hicetnunc/${id}`} full>
            <Purchase>
              Collect on Objkt.com for{' '}
              {parseFloat(cheapestListing.price / 1000000)} tez
            </Purchase>
          </Button>
        )
      }
    } else {
      purchaseButton = (
        <Button full>
          <Purchase>Not for sale</Purchase>
        </Button>
      )
    }

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
        <div style={{ height: '30px' }}></div>
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
              <Button to={`${PATH.OBJKT}/${id}`} disabled={isDetailView}>
                <Primary>OBJKT#{id}</Primary>
              </Button>
            </div>
          )}
        </div>

        {/* SHOW SIGNING UI IF COLLABORATOR */}
        {isDetailView && isCollab && isCoreParticipant && !userHasSigned && (
          <div className={styles.container} style={{ paddingTop: 0 }}>
            <SigningUI id={id} hasSigned={false} />
          </div>
        )}

        {isDetailView && !restricted && (
          <div className={`${styles.spread} ${styles.objkt__label__container}`}>
            <div>
              <p className={styles.objkt__label}>OBJKT#{id}</p>
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
        <div className={styles.spread}>
          <Button onClick={() => curate(id)}>
            <Primary>
              <span
                className={styles.top}
                data-position={'top'}
                data-tooltip={'curate'}
              >
                〇
              </span>
            </Primary>
          </Button>
        </div>
      </>
    )
  } else {
    return (
      <div className={styles.container}>
        <div className={styles.edition}>
          <div className={styles.inline}>
            <Button to={`/tz/${creator?.address}`}>
              {creator?.name ? (
                <Primary>{encodeURI(creator?.name)}</Primary>
              ) : (
                <Primary>{walletPreview(creator?.address)}</Primary>
              )}
            </Button>
          </div>
          <div className={styles.objktContainer}>
            <Button to={`${PATH.OBJKT}/${id}`}>
              <Primary>OBJKT#{id}</Primary>
            </Button>
            <Button onClick={() => curate(id)}>
              <Primary>
                <span
                  className={styles.top}
                  data-position={'top'}
                  data-tooltip={'curate'}
                >
                  〇
                </span>
              </Primary>
            </Button>
          </div>
        </div>
      </div>
    )
  }
}
