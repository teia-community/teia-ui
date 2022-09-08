import React, { useContext, useState } from 'react'
import { Button, Primary, Purchase } from '../button'

import { walletPreview } from '../../utils/string'
import styles from './styles.module.scss'
import { HicetnuncContext } from '../../context/HicetnuncContext'
import {
  MarketplaceLabel,
  OBJKTLabel,
  RestrictedLabel,
} from './marketplace-labels'
import useSettings from 'hooks/use-settings'

function TeiaOrHenSwapRow({
  rowId,
  swap,
  acc,
  proxyAdminAddress,
  proxyAddress,
  restricted,
  reswapPrices,
  handleCollect,
  setReswapPrices,
  reswap,
  cancel,
}) {
  const { walletBlockList } = useSettings()

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
        {(restricted || walletBlockList.get(swap.creator_id) === 1) && (
          <RestrictedLabel />
        )}
        <MarketplaceLabel swap={swap} />
        {!restricted &&
          walletBlockList.get(swap.creator_id) !== 1 &&
          !isOwnSwap && (
            <Button
              onClick={() =>
                handleCollect(swap.contract_address, swap.id, swap.price)
              }
            >
              <Purchase>
                Collect for {parseFloat(swap.price / 1000000)} tez
              </Purchase>
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

function ObjktcomAskRow({ id, ask, swap, restricted, onCollectClick }) {
  const { walletBlockList } = useSettings()

  return (
    <div className={styles.swap}>
      <div className={styles.issuer}>
        {ask.amount_left} ed.&nbsp;
        <Button to={`/tz/${ask.seller.address}`}>
          <Primary>
            {ask.seller.alias || walletPreview(ask.seller.address)}
          </Primary>
        </Button>
      </div>

      <div className={styles.buttons}>
        {(restricted || walletBlockList.get(swap.creator_id) === 1) && (
          <RestrictedLabel />
        )}
        <OBJKTLabel />
        {!restricted && walletBlockList.get(swap.creator_id) !== 1 && (
          <Button onClick={() => onCollectClick()}>
            <Purchase>
              Collect for {parseFloat(ask.price / 1000000)} tez
            </Purchase>
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
  reswap,
}) => {
  const { acc, proxyAddress } = useContext(HicetnuncContext)
  const [reswapPrices, setReswapPrices] = useState({})

  return (
    <div className={styles.container}>
      {listings.map((listing) => {
        if (listing.type === 'swap') {
          return (
            <TeiaOrHenSwapRow
              key={listing.key}
              rowId={listing.key}
              swap={listing}
              acc={acc}
              proxyAdminAddress={proxyAdminAddress}
              proxyAddress={proxyAddress}
              restricted={restricted}
              reswapPrices={reswapPrices}
              handleCollect={handleCollect}
              setReswapPrices={setReswapPrices}
              reswap={reswap}
              cancel={cancel}
            />
          )
        } else {
          return (
            <ObjktcomAskRow
              id={id}
              key={listing.key}
              ask={listing}
              swap={listing}
              restricted={restricted}
              onCollectClick={() => {
                handleCollectObjktcomAsk(listing)
              }}
            />
          )
        }
      })}
      <hr className={styles.nomobile}></hr>
    </div>
  )
}
