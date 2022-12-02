import React from 'react'
import get from 'lodash/get'
import { Container, Padding } from '@components/layout'
import { Primary } from '@components/button'
import { walletPreview } from '@utils/string'
import { formatRoyalties } from '@utils'
import { getTimeAgo } from '@utils/time'
import styles from '../styles.module.scss'
import { BURN_ADDRESS } from '@constants'

import { IconCache } from '@utils/with-icon'
import { TradeIcon, MintedIcon, SwapIcon, BurnIcon } from '@icons'
// import MintedIcon from '@icons/minted'
// import SwapIcon from '@icons/swap'

function UsernameAndLink({ event, attr }) {
  return (
    <>
      {get(event, `${attr}_profile.name`) ? (
        <span>
          <a
            href={`/${encodeURI(get(event, `${attr}_profile.name`))}`}
            target="_blank"
            rel="noreferrer"
          >
            <Primary>{get(event, `${attr}_profile.name`)}</Primary>
          </a>
        </span>
      ) : (
        <span>
          <a href={`/tz/${get(event, `${attr}_address`)}`}>
            <Primary>{walletPreview(get(event, `${attr}_address`))}</Primary>
          </a>
        </span>
      )}
    </>
  )
}

/**
 * The History Tab
 * @function
 * @param {{nft:import('@components/media-types/index').NFT}} props
 * @returns {any}
 */
export const History = ({ nft }) => {
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
              {nft.events.map((e) => {
                if (e.implements === 'SALE') {
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
                        <UsernameAndLink event={e} attr="seller" />
                      </div>

                      <div className={styles.history__to}>
                        <div
                          className={`${styles.history__mobile} ${styles.history__secondary}`}
                        >
                          To
                        </div>
                        <UsernameAndLink event={e} attr="buyer" />
                      </div>

                      <div
                        className={`${styles.history__ed} ${styles.history__desktop}`}
                      >
                        1
                      </div>

                      <div
                        className={`${styles.history__price} ${styles.history__desktop}`}
                      >
                        {parseFloat(e.price / 1e6)} tez
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

                        <div className={styles.history__ed}>ed. 1</div>

                        <div className={styles.history__price}>
                          {parseFloat(e.price / 1e6)} tez
                        </div>
                      </div>
                    </div>
                  )
                }
                if (['TEIA_SWAP', 'HEN_SWAP', 'HEN_SWAP_V2'].includes(e.type)) {
                  return (
                    <div className={`${styles.history}`} key={e.id}>
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
                        <UsernameAndLink event={e} attr="seller" />
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
                if (
                  e.type === 'FA2_TRANSFER' &&
                  e.to_address === BURN_ADDRESS
                ) {
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
                        <UsernameAndLink event={e} attr="from" />
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
                  {get(nft, 'artist_profile.name') ? (
                    <span>
                      <a
                        href={`/tz/${encodeURI(nft.artist_address)}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <Primary>{get(nft, 'artist_profile.name')}</Primary>
                      </a>
                    </span>
                  ) : (
                    <span>
                      <a href={`/tz/${nft.artist_address}`}>
                        <Primary>{walletPreview(nft.artist_address)}</Primary>
                      </a>
                    </span>
                  )}
                </div>

                <div className={styles.history__to} />

                <div className={styles.history__ed}>{nft.editions}</div>

                <div className={styles.history__price} />

                <div className={styles.history__date} title={nft.minted_at}>
                  {getTimeAgo(nft.minted_at)}
                </div>

                <div className={styles.history__inner__mobile}>
                  <div className={styles.history__date} title={nft.minted_at}>
                    {getTimeAgo(nft.minted_at)}
                  </div>

                  <div className={styles.history__ed}>ed. {nft.editions}</div>

                  <div className={styles.history__price} />
                </div>
              </div>

              <div className={styles.history__royalties}>
                {formatRoyalties(nft)} Royalties
              </div>
            </div>
          </Padding>
        </Container>
      </IconCache.Provider>
    </div>
  )
}
