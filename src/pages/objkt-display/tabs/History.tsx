import get from 'lodash/get'
import isNumber from 'lodash/isNumber'
import { Container } from '@atoms/layout'
import { walletPreview } from '@utils/string'
import { formatRoyalties } from '@utils'
import { getTimeAgo } from '@utils/time'
import styles from '@style'
import { BURN_ADDRESS } from '@constants'
import { TradeIcon, MintedIcon, SwapIcon, BurnIcon } from '@icons'
import Button from '@atoms/button/Button'
import { useObjktDisplayContext } from '..'

function UsernameAndLink({ event, attr }) {
  return (
    <>
      {get(event, `${attr}_profile.name`) ? (
        <span>
          <Button
            href={`/${encodeURIComponent(get(event, `${attr}_profile.name`))}`}
          >
            {get(event, `${attr}_profile.name`)}
          </Button>
        </span>
      ) : (
        <span>
          <Button href={`/tz/${get(event, `${attr}_address`)}`}>
            {walletPreview(get(event, `${attr}_address`))}
          </Button>
        </span>
      )}
    </>
  )
}

interface HistoryRowProps {
  eventType: React.ReactNode
  editions: number
  timestamp: string
  from?: React.ReactNode
  to?: React.ReactNode
  price?: number
}
function HistoryRow({ eventType, from, to, editions, price, timestamp }: HistoryRowProps) {
  return (
    <div className={`${styles.history}`}>
      <div className={styles.history__event__container}>{eventType}</div>

      <div className={styles.history__from}>
        {from ? (
          <>
            <div
              className={`${styles.history__mobile} ${styles.history__secondary}`}
            >
              From
            </div>
            {from}
          </>
        ) : null}
      </div>

      <div className={styles.history__to}>
        {to ? (
          <>
            <div
              className={`${styles.history__mobile} ${styles.history__secondary}`}
            >
              To
            </div>
            {to}
          </>
        ) : null}
      </div>

      <div className={`${styles.history__ed} ${styles.history__desktop}`}>
        {editions}
      </div>

      <div className={`${styles.history__price} ${styles.history__desktop}`}>
        {isNumber(price) ? `${(price / 1e6)} tez` : null}
      </div>

      <div
        className={`${styles.history__date} ${styles.history__desktop}`}
        title={timestamp}
      >
        {getTimeAgo(timestamp)}
      </div>

      <div className={styles.history__inner__mobile}>
        <div className={styles.history__date} title={timestamp}>
          {getTimeAgo(timestamp)}
        </div>

        <div className={styles.history__ed}>ed. {editions}</div>

        <div className={styles.history__price}>
          {isNumber(price) ? `${price / 1e6} tez` : null}
        </div>
      </div>
    </div>
  )
}

/**
 * The History Tab
 * @function
 * @param {{nft:import('@types').NFT}} props
 * @returns {any}
 */
export const History = () => {
  const { nft } = useObjktDisplayContext()
  const language = (nft as any).language || 'not specified'

  console.debug('nft.events', (nft as any)?.events)
  return (
    <>
      {(nft as any).events && (nft as any).events.length > 0 ? (
        <Container>
          <div className={styles.history__container}>
            <div className={styles.history__labels}>
              <div
                className={styles.history__event}
                style={{ width: 'calc(10% + 35px)' }}
              >
                Event
              </div>
              <div className={styles.history__from}>From</div>
              <div className={styles.history__to}>To</div>
              <div className={styles.history__ed}>Ed.</div>
              <div className={styles.history__price}>Price</div>
              <div className={styles.history__date}>Time</div>
            </div>
            {((nft as any).events || []).map((event) => {
              if (event.implements === 'SALE') {
                return (
                  <HistoryRow
                    key={`t-${event.id}`}
                    eventType={
                      <>
                        <TradeIcon size={14} />
                        <a
                          href={`https://tzkt.io/${event.ophash}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Trade
                        </a>
                      </>
                    }
                    from={<UsernameAndLink event={event} attr="seller" />}
                    to={<UsernameAndLink event={event} attr="buyer" />}
                    editions={1}
                    timestamp={event.timestamp}
                    price={event.price}
                  />
                )
              }
              if (
                [
                  'OBJKT_ASK',
                  'OBJKT_ASK_V2',
                  'OBJKT_ASK_V3',
                  'OBJKT_ASK_V3_PRE',
                  'OBJKT_ASK_V3_2',
                  'TEIA_SWAP',
                  'HEN_SWAP',
                  'HEN_SWAP_V2',
                  'VERSUM_SWAP',
                ].includes(event.type)
              ) {
                return (
                  <HistoryRow
                    key={`t-${event.id}`}
                    eventType={
                      <>
                        <SwapIcon size={14} />
                        <a
                          href={`https://tzkt.io/${event.ophash}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Swap
                        </a>
                      </>
                    }
                    from={<UsernameAndLink event={event} attr="seller" />}
                    editions={event.amount}
                    timestamp={event.timestamp}
                    price={event.price}
                  />
                )
              }
              if (
                event.type === 'FA2_TRANSFER' &&
                event.to_address !== BURN_ADDRESS &&
                !event.from_address.startsWith('KT1') &&
                !event.to_address.startsWith('KT1')
              ) {
                return (
                  <HistoryRow
                    key={`t-${event.id}`}
                    eventType={
                      <>
                        <TradeIcon size={14} />
                        <a
                          href={`https://tzkt.io/${event.ophash}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Transfer
                        </a>
                      </>
                    }
                    from={<UsernameAndLink event={event} attr="from" />}
                    to={<UsernameAndLink event={event} attr="to" />}
                    editions={event.amount}
                    timestamp={event.timestamp}
                  />
                )
              }
              if (event.type === 'FA2_TRANSFER' && event.to_address === BURN_ADDRESS) {
                return (
                  <HistoryRow
                    key={`t-${event.id}`}
                    eventType={
                      <>
                        <BurnIcon size={14} />
                        <a
                          href={`https://tzkt.io/${event.ophash}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Burn
                        </a>
                      </>
                    }
                    from={<UsernameAndLink event={event} attr="from" />}
                    to={
                      <span>
                        <Button href={`/tz/${encodeURIComponent(BURN_ADDRESS)}`}>
                          Burn Address
                        </Button>
                      </span>
                    }
                    editions={event.amount}
                    timestamp={event.timestamp}
                  />
                )
              }

              if (event.type === 'HEN_MINT') {
                return (
                  <HistoryRow
                    key={`t-${event.id}`}
                    eventType={
                      <>
                        <MintedIcon size={14} />
                        <div className={styles.history__mint__op}>Minted</div>
                      </>
                    }
                    editions={event.editions}
                    timestamp={event.timestamp}
                  />
                )
              }

              return null
            })}

            <div className={styles.history__royalties}>
              {formatRoyalties(nft)} Royalties
            </div>
          </div>
        </Container>
      ) : (
        <Container>
          <div className={styles.history__container}>
            <p>No history for this OBJKT</p>
            <div className={styles.history__royalties}>
              {formatRoyalties(nft)} Royalties
            </div>
          </div>
        </Container>
      )}
    </>
  )
}
