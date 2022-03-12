import React, { useContext } from 'react'
import { PATH, SUPPORTED_MARKETPLACE_CONTRACTS } from '../../constants'
import { Button, Primary, Purchase } from '../button'
import { HicetnuncContext } from '../../context/HicetnuncContext'
import { walletPreview } from '../../utils/string'
import styles from './styles.module.scss'
import collabStyles from '../collab/styles.module.scss'
import { CollabIssuerInfo } from '../collab/show/CollabIssuerInfo'

const _ = require('lodash')

function countEditionsForSale(token_holders) {
  const quantities = token_holders
    .filter((holder) => SUPPORTED_MARKETPLACE_CONTRACTS.includes(holder.holder_id))
    .map((holder) => holder.quantity)

  return _.sum(quantities)
}

export const ItemInfo = ({
  id,
  swaps,
  creator,
  is_signed,
  token_signatures,
  feed,
  token_holders,
  supply,
  isDetailView,
  restricted
}) => {
  const { syncTaquito, collect, curate, acc } =
    useContext(HicetnuncContext)

  if (isDetailView) {
    // TODO: subtract burned pieces from total
    const total = supply
    const editionsForSale = countEditionsForSale(token_holders)
    const ed = editionsForSale || 'X'

    swaps = swaps.filter(e => SUPPORTED_MARKETPLACE_CONTRACTS.includes(e.contract_address) && parseInt(e.status) === 0 && e.is_valid)
    console.log(swaps)
    let s = _.minBy(swaps, (o) => Number(o.price))

    var message = ''

    try {
      message =
        swaps[0] !== undefined
          ? 'Collect for ' + Number(s.price) / 1000000 + ' tez'
          : 'Not for sale'
    } catch (e) {
      message = 'Not for sale'
    }

    const handleCollect = () => {
      if (acc == null) {
        syncTaquito()
      } else {
        collect(s.contract_address, s.id, s.price * 1)
      }
    }

    // Check collab status
    const isCollab = creator.is_split

    return (
      <>
        <div style={{ height: '30px' }}></div>
        <div className={styles.container}>
          <div className={styles.edition}>

            <div className={collabStyles.relative}>
              <div className={styles.inline}>

                {isCollab && (
                  <CollabIssuerInfo creator={creator} />
                )}

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
              <span
                className={styles.top}
                data-position={'top'}
                data-tooltip={'curate'}
              >
                〇
              </span>
            </div>
          )}
        </div>

        {isDetailView && !restricted && (
          <div className={`${styles.spread} ${styles.objkt__label__container}`}>
            <p className={styles.objkt__label}>OBJKT#{id}</p>
            <Button onClick={() => handleCollect()} full>
              <Purchase>{message}</Purchase>
            </Button>
          </div>
        )}
      </>
    )
  } else {
    return (
      <div className={styles.container}>
        <div className={styles.edition}>
          <div className={styles.inline}>
            <Button
              to={
                `/tz/${creator?.address}`
              }
            >
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
