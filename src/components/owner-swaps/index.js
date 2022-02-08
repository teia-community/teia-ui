import React, { useContext, useState } from 'react'
import { Button, Primary, Purchase } from '../button'
import { MARKETPLACE_CONTRACT_V1, MARKETPLACE_CONTRACT_V2, MARKETPLACE_CONTRACT_TEIA } from '../../constants'
import { walletPreview } from '../../utils/string'
import styles from './styles.module.scss'
import { HicetnuncContext } from '../../context/HicetnuncContext'

const sortByPrice = (a, b) => {
  return Number(a.xtz_per_objkt) - Number(b.xtz_per_objkt)
}

const TeiaLabel = () => (
  <span className={styles.teiaLabel} title="buy this listing and support teia">
    <span style={{ color: '#f79533' }}>T</span><span style={{ color: '#ef4e7b' }}>E</span><span style={{ color: '#5073b8' }}>I</span><span style={{ color: '#07b39b' }}>A</span>
  </span>
);

export const OwnerSwaps = ({ swaps, handleCollect, cancel, proxyAdminAddress, restricted, ban, cancelv1, reswap }) => {

  console.log("SWAPS", proxyAdminAddress);


  const { acc, proxyAddress } = useContext(HicetnuncContext)
  const [reswapPrices, setReswapPrices] = useState({});

  const v1Swaps = swaps.filter(e => e.contract_address === MARKETPLACE_CONTRACT_V1 && parseInt(e.status) === 0)

  const v2andTeiaSwaps = swaps
    .filter(e => [MARKETPLACE_CONTRACT_V2, MARKETPLACE_CONTRACT_TEIA].includes(e.contract_address) && parseInt(e.status) === 0 && e.is_valid)
    .sort(sortByPrice)

  return (
    <div className={styles.container}>
      {
        v1Swaps.length > 0 && (
          <div>
            {v1Swaps.map((e, index) => {
              if (acc) {
                if (acc.address === e.creator_id) {
                  return (
                    <div>
                      <div key={`${e.id}-${index}`} className={styles.swap}>
                        <div className={styles.issuer}>
                          {e.amount_left} ed.&nbsp;
                          <Button to={`/tz/${MARKETPLACE_CONTRACT_V1}`}>
                            <Primary>OBJKTSWAP V1</Primary>
                          </Button>
                        </div>
                        <div className={styles.buttons}>
                          <Button onClick={() => cancelv1(e.id)}>
                            <Purchase>cancel</Purchase>
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                } else {
                  return undefined
                }
              } else {
                return undefined
              }
            })}
          </div>
        )
      }
      {v2andTeiaSwaps.map((swap, index) => {

        const showCancel = (swap.creator.address === acc?.address) || (proxyAdminAddress === acc?.address && swap.creator.address === proxyAddress)
        const key = `${swap.contract_address}-${swap.id}`;

        return (
          <div key={key} className={styles.swap}>
            <div className={styles.issuer} style={{ position: 'relative' }}>
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
              {!restricted && (
                !ban.includes(swap.creator_id) && (
                <>
                  {swap.contract_address === MARKETPLACE_CONTRACT_TEIA ? (<TeiaLabel />) : null}
                <Button onClick={() => handleCollect(swap.contract_address, swap.id, swap.price)}>
                  <Purchase>
                    collect for {parseFloat(swap.price / 1000000)} tez
                  </Purchase>
                </Button>
                </>
              ))}
              {showCancel && (
                  <>
                    <div className={styles.break}></div>
                    <input
                      value={reswapPrices[key] || ''}
                      onChange={(ev) => {
                        const { value } = ev.target;
                        setReswapPrices((prevVal) => ({ ...prevVal, [key]: value }));
                      }}
                      type="number"
                      placeholder="New price"
                    />
                    <Button onClick={() => {
                      const priceTz = reswapPrices[key]

                      if (!priceTz || priceTz <= 0) {
                        // TODO: communicate the error to the user.
                        return
                      }

                      // TODO: add a indicator (spinner or something) that shows that the reswap is in progress
                      reswap(priceTz * 1000000, swap)
                      // TODO: after the reswap was successful we should send some feedback to the user
                    }}>
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
      })}
    </div>
  )
}
