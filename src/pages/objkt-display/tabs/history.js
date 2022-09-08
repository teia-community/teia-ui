import React from 'react'
import { Container, Padding } from '@components/layout'
import { Primary } from '@components/button'
import { walletPreview } from '@utils/string'
import { getTimeAgo } from '@utils/time'
import styles from '../styles.module.scss'
import { BURN_ADDRESS } from '@constants'

import { IconCache } from '@utils/with-icon'
import { TradeIcon, MintedIcon, SwapIcon, BurnIcon } from '@icons'
// import MintedIcon from '@icons/minted'
// import SwapIcon from '@icons/swap'

const OPERATION_SWAP = 'SWAP'
const OPERATION_TRANSFER = 'TRANSFER'
const OPERATION_TRADE = 'TRADE'

/**
 * The History Tab
 * @function
 * @param {{nft:import('@components/media-types/index').NFT}} props
 * @returns {any}
 */
export const History = ({ nft }) => {
  const trades = nft.trades.map((e) => ({
    ...e,
    type: OPERATION_TRADE,
  }))
  const swaps = nft.swaps.map((e) => ({ ...e, type: OPERATION_SWAP }))
  const transfers = nft.transfers.map((e) => ({
    ...e,
    type: OPERATION_TRANSFER,
  }))

  const history = [...trades, ...swaps, ...transfers]
    .sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp))
    .reverse()

  return (
    <div>
      <IconCache.Provider value={{}}>
        <Container>
          <Padding>
            <div className={styles.history__container}>
              <div className={styles.history__labels}>
                <div
                  className={styles.history__event}
                  style={{ width: 'calc(7% + 35px)' }}
                >
                  Event
                </div>
                <div className={styles.history__from}>From</div>
                <div className={styles.history__to}>To</div>
                <div className={styles.history__ed}>Ed.</div>
                <div className={styles.history__price}>Price</div>
                <div className={styles.history__date}>Time</div>
              </div>
              {history.map((e) => {
                if (e.type === OPERATION_TRADE) {
                  return (
                    <div className={`${styles.history}`} key={`t-${e.id}`}>
                      <div className={styles.history__event__container}>
                        <TradeIcon size={14} viewBox={16} />
                        <a
                          href={`https://tzkt.io/${e.ophash}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Trade
                        </a>
                      </div>

                      <div className={styles.history__from}>
                        <div
                          className={`${styles.history__mobile} ${styles.history__secondary}`}
                        >
                          From
                        </div>
                        {e.seller.name ? (
                          <span>
                            <a
                              href={`/tz/${encodeURI(e.seller.address)}`}
                              target="_blank"
                              rel="noreferrer"
                            >
                              <Primary>{e.seller.name}</Primary>
                            </a>
                          </span>
                        ) : (
                          <span>
                            <a href={`/tz/${e.seller.address}`}>
                              <Primary>
                                {walletPreview(e.seller.address)}
                              </Primary>
                            </a>
                          </span>
                        )}
                      </div>

                      <div className={styles.history__to}>
                        <div
                          className={`${styles.history__mobile} ${styles.history__secondary}`}
                        >
                          To
                        </div>
                        {e.buyer.name ? (
                          <span>
                            <a
                              href={`/${encodeURI(e.buyer.name)}`}
                              target="_blank"
                              rel="noreferrer"
                            >
                              <Primary>{e.buyer.name}</Primary>
                            </a>
                          </span>
                        ) : (
                          <span>
                            <a href={`/tz/${e.buyer.address}`}>
                              <Primary>
                                {walletPreview(e.buyer.address)}
                              </Primary>
                            </a>
                          </span>
                        )}
                      </div>

                      <div
                        className={`${styles.history__ed} ${styles.history__desktop}`}
                      >
                        {e.amount}
                      </div>

                      <div
                        className={`${styles.history__price} ${styles.history__desktop}`}
                      >
                        {parseFloat(e.swap.price / 1e6)} tez
                      </div>

                      <div
                        className={`${styles.history__date} ${styles.history__desktop}`}
                        title={e.timestamp}
                      >
                        {getTimeAgo(e.timestamp)}
                      </div>

                      <div className={styles.history__inner__mobile}>
                        <div
                          className={styles.history__date}
                          title={e.timestamp}
                        >
                          {getTimeAgo(e.timestamp)}
                        </div>

                        <div className={styles.history__ed}>ed. {e.amount}</div>

                        <div className={styles.history__price}>
                          {parseFloat(e.swap.price / 1e6)} tez
                        </div>
                      </div>
                    </div>
                  )
                }
                if (e.type === OPERATION_SWAP) {
                  return (
                    <div className={`${styles.history}`} key={`s-${e.opid}`}>
                      <div className={styles.history__event__container}>
                        <SwapIcon size={14} viewBox={16} />
                        <a
                          href={`https://tzkt.io/${e.ophash}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Swap
                        </a>
                      </div>

                      <div className={styles.history__from}>
                        <div
                          className={`${styles.history__mobile} ${styles.history__secondary}`}
                        >
                          from
                        </div>
                        {e.creator.name ? (
                          <span>
                            <a
                              href={`/tz/${encodeURI(e.creator.address)}`}
                              target="_blank"
                              rel="noreferrer"
                            >
                              <Primary>{e.creator.name}</Primary>
                            </a>
                          </span>
                        ) : (
                          <span>
                            <a href={`/tz/${e.creator.address}`}>
                              <Primary>
                                {walletPreview(e.creator.address)}
                              </Primary>
                            </a>
                          </span>
                        )}
                      </div>

                      <div className={styles.history__to} />
                      <div className={styles.history__ed}>{e.amount}</div>

                      <div className={styles.history__price}>
                        {parseFloat(e.price / 1e6)} tez
                      </div>

                      <div className={styles.history__date} title={e.timestamp}>
                        {getTimeAgo(e.timestamp)}
                      </div>

                      <div className={styles.history__inner__mobile}>
                        <div
                          className={styles.history__date}
                          title={e.timestamp}
                        >
                          {getTimeAgo(e.timestamp)}
                        </div>

                        <div className={styles.history__ed}>ed. {e.amount}</div>

                        <div className={styles.history__price}>
                          {parseFloat(e.price / 1e6)} tez
                        </div>
                      </div>
                    </div>
                  )
                }
                if (e.type === OPERATION_TRANSFER) {
                  return (
                    <div className={`${styles.history}`} key={`b-${e.opid}`}>
                      <div className={styles.history__event__container}>
                        <BurnIcon size={14} viewBox={16} />
                        <a
                          href={`https://tzkt.io/${e.ophash}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Burn
                        </a>
                      </div>

                      <div className={styles.history__from}>
                        <div
                          className={`${styles.history__mobile} ${styles.history__secondary}`}
                        >
                          From
                        </div>
                        {e.sender.name ? (
                          <span>
                            <a
                              href={`/tz/${encodeURI(e.sender.address)}`}
                              target="_blank"
                              rel="noreferrer"
                            >
                              <Primary>{e.sender.name}</Primary>
                            </a>
                          </span>
                        ) : (
                          <span>
                            <a href={`/tz/${e.sender.address}`}>
                              <Primary>
                                {walletPreview(e.sender.address)}
                              </Primary>
                            </a>
                          </span>
                        )}
                      </div>

                      <div className={styles.history__to}>
                        <div
                          className={`${styles.history__mobile} ${styles.history__secondary}`}
                        >
                          To
                        </div>
                        {
                          <span>
                            <a
                              href={`/tz/${encodeURI(BURN_ADDRESS)}`}
                              target="_blank"
                              rel="noreferrer"
                            >
                              <Primary>Burn Address</Primary>
                            </a>
                          </span>
                        }
                      </div>

                      <div
                        className={`${styles.history__ed} ${styles.history__desktop}`}
                      >
                        {e.amount}
                      </div>

                      <div
                        className={`${styles.history__price} ${styles.history__desktop}`}
                      ></div>

                      <div
                        className={`${styles.history__date} ${styles.history__desktop}`}
                        title={e.timestamp}
                      >
                        {getTimeAgo(e.timestamp)}
                      </div>

                      <div className={styles.history__inner__mobile}>
                        <div
                          className={styles.history__date}
                          title={e.timestamp}
                        >
                          {getTimeAgo(e.timestamp)}
                        </div>

                        <div className={styles.history__ed}>ed. {e.amount}</div>

                        <div className={styles.history__price}></div>
                      </div>
                    </div>
                  )
                }

                return null
              })}

              <div className={styles.history} key="mint-op">
                <div className={styles.history__event__container}>
                  <MintedIcon size={14} viewBox={16} />
                  <div className={styles.history__mint__op}>Minted</div>
                </div>

                <div className={styles.history__from}>
                  {nft.creator.name ? (
                    <span>
                      <a
                        href={`/tz/${encodeURI(nft.creator.address)}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <Primary>{nft.creator.name}</Primary>
                      </a>
                    </span>
                  ) : (
                    <span>
                      <a href={`/tz/${nft.creator.address}`}>
                        <Primary>{walletPreview(nft.creator.address)}</Primary>
                      </a>
                    </span>
                  )}
                </div>

                <div className={styles.history__to} />

                <div className={styles.history__ed}>{nft.supply}</div>

                <div className={styles.history__price} />

                <div className={styles.history__date} title={nft.timestamp}>
                  {getTimeAgo(nft.timestamp)}
                </div>

                <div className={styles.history__inner__mobile}>
                  <div className={styles.history__date} title={nft.timestamp}>
                    {getTimeAgo(nft.timestamp)}
                  </div>

                  <div className={styles.history__ed}>ed. {nft.supply}</div>

                  <div className={styles.history__price} />
                </div>
              </div>

              <div className={styles.history__royalties}>
                {nft.royalties / 10}% Royalties
              </div>
            </div>
          </Padding>
        </Container>
      </IconCache.Provider>
    </div>
  )
}
