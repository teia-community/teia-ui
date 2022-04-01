import React, { useContext, useState } from 'react'
import { Button, Primary, Purchase } from '../button'
import {
  MARKETPLACE_CONTRACT_TEIA,
  MARKETPLACE_CONTRACT_V1,
  MARKETPLACE_CONTRACT_V2,
} from '../../constants'
import { walletPreview } from '../../utils/string'
import styles from './styles.module.scss'
import { HicetnuncContext } from '../../context/HicetnuncContext'

const TeiaLabel = () => (
  <span className={styles.swapLabel} title="buy this listing and support teia">
    TEIA
  </span>
)
const HENLabel = () => (
  <span
    className={styles.swapLabel}
    title="this listing is through the original HEN contract"
  >
    H=N
  </span>
)
const OBJKTLabel = () => (
  <span className={styles.swapLabel} title="This swap is through OBJKT.com">
    Objkt.com
  </span>
)

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
        {swap.contract_address === MARKETPLACE_CONTRACT_TEIA ? (
          <>
            &nbsp;
            <TeiaLabel />
          </>
        ) : null}
        {swap.contract_address === MARKETPLACE_CONTRACT_V2 ||
        swap.contract_address === MARKETPLACE_CONTRACT_V1 ? (
          <>
            &nbsp;
            <HENLabel />
          </>
        ) : null}
        {!restricted && !ban.includes(swap.creator_id) && !isOwnSwap && (
          <>
            <Button
              onClick={() =>
                handleCollect(swap.contract_address, swap.id, swap.price)
              }
            >
              <Purchase>
                Collect for {parseFloat(swap.price / 1000000)} tez
              </Purchase>
            </Button>
          </>
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
              <Purchase>reswap</Purchase>
            </Button>

            <Button onClick={() => cancel(swap.contract_address, swap.id)}>
              <Purchase>cancel</Purchase>
            </Button>
          </>
        )}
      </div>
    </div>
  )
}

function ObjktcomAskRow({ id, ask }) {
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
        <Button href={`https://objkt.com/asset/hicetnunc/${id}`}>
          <Purchase>
            On the sussy amogus for {parseFloat(ask.price / 1000000)} tez
          </Purchase>
        </Button>
      </div>
    </div>
  )
}

export const Listings = ({
  id,
  listings,
  handleCollect,
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
              ban={ban}
              reswapPrices={reswapPrices}
              handleCollect={handleCollect}
              setReswapPrices={setReswapPrices}
              reswap={reswap}
              cancel={cancel}
            />
          )
        } else {
          return <ObjktcomAskRow id={id} key={listing.key} ask={listing} />
        }
      })}
    </div>
  )
}
