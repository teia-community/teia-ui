import React, { useContext, useState } from 'react'
import { Button, Primary, Purchase } from '../button'

import { walletPreview } from '../../utils/string'
import styles from './styles.module.scss'
import { HicetnuncContext } from '../../context/HicetnuncContext'
import {
  MarketplaceLabel,
  OBJKTLabel,
  DonoLabel,
  RestrictedLabel,
} from './marketplace-labels'

function TeiaOrHenSwapRow({
  rowId,
  swap,
  acc,
  proxyAdminAddress,
  proxyAddress,
  restricted,
  ban,
  reswapPrices,
  handleCollect,
  setReswapPrices,
  reswap,
  cancel,
}) {
  const isOwnSwap =
    swap.creator.address === acc?.address ||
    (proxyAdminAddress === acc?.address &&
      swap.creator.address === proxyAddress)

  return (
    <div className={styles.swap}>
      <div className={styles.issuer}>
        {swap.amount_left} ed.&nbsp;
        {swap.creator.name ? (
          <Button to={`/tz/${swap.creator.address}`}>
            <Primary>{encodeURI(swap.creator.name)}</Primary>
          </Button>
        ) : (
          <Button to={`/tz/${swap.creator.address}`}>
            <Primary>{walletPreview(swap.creator.address)}</Primary>
          </Button>
        )}
      </div>
      <div className={styles.buttons}>
        {(restricted || ban.includes(swap.creator_id)) && <RestrictedLabel />}
        <MarketplaceLabel swap={swap} />
        {!restricted && !ban.includes(swap.creator_id) && !isOwnSwap && (
          <Button
            onClick={() =>
              handleCollect(swap.contract_address, swap.id, swap.price)
            }
          >
            <Purchase listing={swap} />
          </Button>
        )}
        {isOwnSwap && (
          <>
            <div className={styles.break}></div>
            <input
              value={reswapPrices[rowId] || parseFloat(swap.price / 1000000)}
              onChange={(ev) => {
                const { value } = ev.target
                setReswapPrices((prevVal) => ({
                  ...prevVal,
                  [rowId]: value,
                }))
              }}
              type="number"
              placeholder="New price"
              style={{ width: '80px', marginRight: '5px' }}
            />
            <Button
              onClick={() => {
                const priceTz = reswapPrices[rowId]

                if (!priceTz || priceTz <= 0) {
                  // TODO: communicate the error to the user.
                  return
                }

                // TODO: add a indicator (spinner or something) that shows that the reswap is in progress
                reswap(priceTz * 1000000, swap)
                // TODO: after the reswap was successful we should send some feedback to the user
              }}
            >
              <Purchase className={styles.smol}>reswap</Purchase>
            </Button>

            <Button
              onClick={() => cancel(swap.contract_address, swap.id)}
              className={styles.smol}
            >
              <Purchase>cancel</Purchase>
            </Button>
          </>
        )}
      </div>
    </div>
  )
}

function DonoClaimRow({ id, swap, restricted, ban, onCollectClick }) {
  return (
    <div className={styles.swap}>
      <div className={styles.issuer}>
        {swap.amount_left} ed.&nbsp;
        <Button to={`https://dono.xtz.tools`}>
          <Primary>dono.xtz</Primary>
        </Button>
      </div>

      <div className={styles.buttons}>
        {(restricted || ban.includes(swap.creator_id)) && <RestrictedLabel />}
        <DonoLabel />
        {!restricted && !ban.includes(swap.creator_id) && (
          <Button onClick={() => onCollectClick()}>
            <Purchase listing={swap} />
          </Button>
        )}
      </div>
    </div>
  )
}
function ObjktcomAskRow({ id, swap, restricted, ban, onCollectClick }) {
  return (
    <div className={styles.swap}>
      <div className={styles.issuer}>
        {swap.amount_left} ed.&nbsp;
        <Button to={`/tz/${swap.seller.address}`}>
          <Primary>
            {swap.seller.alias || walletPreview(swap.seller.address)}
          </Primary>
        </Button>
      </div>

      <div className={styles.buttons}>
        {(restricted || ban.includes(swap.creator_id)) && <RestrictedLabel />}
        <OBJKTLabel />
        {!restricted && !ban.includes(swap.creator_id) && (
          <Button onClick={() => onCollectClick()}>
            <Purchase listing={swap} />
          </Button>
        )}
      </div>
    </div>
  )
}

export const Listings = ({
  id,
  listings,
  handleCollect,
  handleCollectObjktcomAsk,
  cancel,
  proxyAdminAddress,
  restricted,
  ban,
  reswap,
}) => {
  const { acc, proxyAddress } = useContext(HicetnuncContext)
  const [reswapPrices, setReswapPrices] = useState({})

  return (
    <div className={styles.container}>
      {listings.map((listing) => {
        switch (listing.type) {
          case 'swap':
            return (
              <TeiaOrHenSwapRow
                key={listing.key}
                rowId={listing.key}
                swap={listing}
                acc={acc}
                proxyAdminAddress={proxyAdminAddress}
                proxyAddress={proxyAddress}
                restricted={restricted}
                ban={ban}
                reswapPrices={reswapPrices}
                handleCollect={handleCollect}
                setReswapPrices={setReswapPrices}
                reswap={reswap}
                cancel={cancel}
              />
            )
          case 'giveaway':
            return (
              <DonoClaimRow
                id={id}
                key={listing.key}
                swap={listing}
                restricted={restricted}
                ban={ban}
                onCollectClick={() => {
                  handleCollectObjktcomAsk(listing)
                }}
              />
            )
          case 'objktcom_ask':
            return (
              <ObjktcomAskRow
                id={id}
                key={listing.key}
                swap={listing}
                restricted={restricted}
                ban={ban}
                onCollectClick={() => {
                  handleCollectObjktcomAsk(listing)
                }}
              />
            )
          default:
            return null
        }
      })}
      <hr className={styles.nomobile} />
    </div>
  )
}
