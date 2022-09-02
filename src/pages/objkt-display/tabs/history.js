import React, { useEffect, useRef, useState, useCallback } from 'react'
import { Container, Padding } from '@components/layout'
import { Primary } from '@components/button'
import { walletPreview } from '@utils/string'
import { getTimeAgo, getWordDate } from '@utils/time'
import styles from '../styles.module.scss'
import { BURN_ADDRESS } from '@constants'

import { IconCache } from '@utils/with-icon'
import { TradeIcon, MintedIcon, SwapIcon, BurnIcon } from '@icons'
import { Checkbox } from '@components/input/index'
import _ from 'lodash'
import { Table } from '@components/table'

const OPERATION_SWAP = 'SWAP'
const OPERATION_TRANSFER = 'TRANSFER'
const OPERATION_TRADE = 'TRADE'

const NO_VALUE = ' '

export const History = (token_info) => {
  const trades = token_info.trades.map((e) => ({
    ...e,
    type: OPERATION_TRADE,
  }))
  const swaps = token_info.swaps.map((e) => ({ ...e, type: OPERATION_SWAP }))
  const transfers = token_info.transfers.map((e) => ({
    ...e,
    receiver: BURN_ADDRESS,
    type: OPERATION_TRANSFER,
  }))

  const [ago, setAgo] = useState(false)
  const getTime = useCallback(
    (e) => {
      return ago ? getWordDate(e.timestamp) : getTimeAgo(e.timestamp)
      //   // : getISODate(e.timestamp)
    },
    [ago]
  )
  useEffect(() => {
    history_ref.current = history_ref.current.map((e) => {
      e.optime = getTime(e)
      return e
    })
  }, [getTime, ago])

  useEffect(() => {
    setAgo(true)
  }, [])

  const getNameOrAddress = (accessor, e) => {
    const name = _.get(e, `${accessor}.name`)
    if (name) {
      return (
        <span>
          <a href={`/${encodeURI(name)}`} target="_blank" rel="noreferrer">
            <Primary>{name}</Primary>
          </a>
        </span>
      )
    }

    const address = _.get(e, `${accessor}.address`)
    if (address != null) {
      return (
        <span>
          <a href={`/tz/${address}`} target="_blank" rel="noreferrer">
            <Primary>{walletPreview(address)}</Primary>
          </a>
        </span>
      )
    }
    return NO_VALUE
  }

  const getTezFromMutez = (accessor, e) => {
    return e.price ? `${parseFloat(e.price) / 1e6}ꜩ` : NO_VALUE
  }

  const getEvent = (accessor, e) => {
    const className = styles.event
    if (e.type === OPERATION_TRADE) {
      return (
        <div className={className}>
          <TradeIcon key="AS" size={14} viewBox={16} />
          <a
            href={`https://tzkt.io/${e.ophash}`}
            target="_blank"
            rel="noreferrer"
          >
            Trade
          </a>
        </div>
      )
    }
    if (e.type === OPERATION_SWAP) {
      return (
        <div className={className}>
          <SwapIcon size={14} viewBox={16} />
          <a
            href={`https://tzkt.io/${e.ophash}`}
            target="_blank"
            rel="noreferrer"
          >
            Swap
          </a>
        </div>
      )
    }

    if (e.type === OPERATION_TRANSFER) {
      return (
        <div className={className}>
          <BurnIcon size={14} viewBox={16} />
          <a
            href={`https://tzkt.io/${e.ophash}`}
            target="_blank"
            rel="noreferrer"
          >
            Burn
          </a>
        </div>
      )
    }
    if (e.type === 'MINT') {
      return (
        <div className={className}>
          <MintedIcon size={14} viewBox={16} />
          <a
            href={`https://tzkt.io/KT1RJ6PbjHpwc3M5rw5s2Nbmefwbuwbdxton/tokens/${token_info.id}`}
            target="_blank"
            rel="noreferrer"
          >
            Minted
          </a>
        </div>
      )
    }
  }

  const columns = [
    // { label: "ID", accessor: "id", sortable: false },
    { label: 'Event', accessor: 'type', sortable: true, transform: getEvent },
    {
      label: 'From',
      accessor: 'from',
      sortable: false,
      transform: getNameOrAddress,
    },
    {
      label: 'To',
      accessor: 'to',
      sortable: true,
      transform: getNameOrAddress,
    },
    { label: 'Ed.', accessor: 'amount', sortable: true },
    {
      label: 'Price',
      accessor: 'price',
      sortable: true,
      transform: getTezFromMutez,
    },
    {
      label: 'Time',
      accessor: 'optime',
      sortable: true,
      sort_key: 'timestamp',
    },
  ]

  let history = [...trades, ...swaps, ...transfers]

  history.push({
    type: 'MINT',
    from: token_info.creator,
    amount: token_info.supply,
    timestamp: token_info.timestamp,
    ophash: 909,
  })
  history = history.map((e) => {
    // for swaps and burns
    e.from = e.seller || e.creator || e.sender
    e.to = e.buyer || e.receiver

    // apply transforms
    for (const c of columns) {
      if (c.transform != null) {
        _.set(e, c.accessor, c.transform(c.accessor, e))
      }
    }
    return { ...e, price: e.price || e.swap.price, optime: getTime(e) }
  })

  const history_ref = useRef(history)

  return (
    <div>
      <IconCache.Provider value={{}}>
        <Container large>
          <Padding>
            <div className={styles.history__buttons}>
              <Checkbox
                label="Display full date"
                checked={ago}
                onChange={(e) => {
                  setAgo(e.target.checked)
                }}
                name="date-format"
              />
            </div>
            <Table
              keyAccessor="timestamp"
              caption="History"
              data={history_ref.current}
              columns={columns}
            />
            <div className={styles.history__royalties}>
              {token_info.royalties / 10}% Royalties
            </div>

            {/* <div className={styles.history__container}>
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
                const opTime = getTime(ago, e.timestamp)

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
                              href={`/${encodeURI(e.seller.name)}`}
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
                        {opTime}
                      </div>

                      <div className={styles.history__inner__mobile}>
                        <div
                          className={styles.history__date}
                          title={e.timestamp}
                        >
                          {opTime}
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
                              href={`/${encodeURI(e.creator.name)}`}
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
                        {opTime}
                      </div>

                      <div className={styles.history__inner__mobile}>
                        <div
                          className={styles.history__date}
                          title={e.timestamp}
                        >
                          {opTime}
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
                              href={`/${encodeURI(e.sender.name)}`}
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
                        {opTime}
                      </div>

                      <div className={styles.history__inner__mobile}>
                        <div
                          className={styles.history__date}
                          title={e.timestamp}
                        >
                          {opTime}
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
                  {token_info.creator.name ? (
                    <span>
                      <a
                        href={`/${encodeURI(token_info.creator.name)}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <Primary>{token_info.creator.name}</Primary>
                      </a>
                    </span>
                  ) : (
                    <span>
                      <a href={`/tz/${token_info.creator.address}`}>
                        <Primary>
                          {walletPreview(token_info.creator.address)}
                        </Primary>
                      </a>
                    </span>
                  )}
                </div>

                <div className={styles.history__to} />

                <div className={styles.history__ed}>{token_info.supply}</div>

                <div className={styles.history__price} />

                <div
                  className={styles.history__date}
                  title={token_info.timestamp}
                >
                  {getTime(ago, token_info.timestamp)}
                </div>

                <div className={styles.history__inner__mobile}>
                  <div
                    className={styles.history__date}
                    title={token_info.timestamp}
                  >
                    {getTime(ago, token_info.timestamp)}
                  </div>

                  <div className={styles.history__ed}>
                    ed. {token_info.supply}
                  </div>

                  <div className={styles.history__price} />
                </div>
              </div>

              <div className={styles.history__royalties}>
                {token_info.royalties / 10}% Royalties

              </div>
              <div className={styles.history__buttons}>
                <Checkbox
                  label="Display time ago"
                  checked={ago}
                  onChange={(e) => {
                    setAgo(e.target.checked)
                  }}
                  name="date-format"
                />
              </div>

            </div> */}
          </Padding>
        </Container>
      </IconCache.Provider>
    </div>
  )
}
