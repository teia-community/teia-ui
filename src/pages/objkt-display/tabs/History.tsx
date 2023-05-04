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
          <Button href={`/${encodeURI(get(event, `${attr}_profile.name`))}`}>
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

function HistoryRow({ eventType, from, to, editions, price, timestamp }) {
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
        {isNumber(price) ? `${parseFloat(price / 1e6)} tez` : null}
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
          {isNumber(price) ? `${parseFloat(price / 1e6)} tez` : null}
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

  console.debug('nft.events', nft?.events)

  return (
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
        {nft.events.map((e) => {
          if (e.implements === 'SALE') {
            return (
              <HistoryRow
                key={`t-${e.id}`}
                eventType={
                  <>
                    <TradeIcon size={14} />
                    <a
                      href={`https://tzkt.io/${e.ophash}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Trade
                    </a>
                  </>
                }
                from={<UsernameAndLink event={e} attr="seller" />}
                to={<UsernameAndLink event={e} attr="buyer" />}
                editions={1}
                timestamp={e.timestamp}
                price={e.price}
              />
            )
          }
          if (
            [
              'OBJKT_ASK',
              'OBJKT_ASK_V2',
              'TEIA_SWAP',
              'HEN_SWAP',
              'HEN_SWAP_V2',
              'VERSUM_SWAP',
            ].includes(e.type)
          ) {
            return (
              <HistoryRow
                key={`t-${e.id}`}
                eventType={
                  <>
                    <SwapIcon size={14} />
                    <a
                      href={`https://tzkt.io/${e.ophash}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Swap
                    </a>
                  </>
                }
                from={<UsernameAndLink event={e} attr="seller" />}
                editions={e.amount}
                timestamp={e.timestamp}
                price={e.price}
              />
            )
          }
          if (
            e.type === 'FA2_TRANSFER' &&
            e.to_address !== BURN_ADDRESS &&
            !e.from_address.startsWith('KT1') &&
            !e.to_address.startsWith('KT1')
          ) {
            return (
              <HistoryRow
                key={`t-${e.id}`}
                eventType={
                  <>
                    <TradeIcon size={14} />
                    <a
                      href={`https://tzkt.io/${e.ophash}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Transfer
                    </a>
                  </>
                }
                from={<UsernameAndLink event={e} attr="from" />}
                to={<UsernameAndLink event={e} attr="to" />}
                editions={e.amount}
                timestamp={e.timestamp}
              />
            )
          }
          if (e.type === 'FA2_TRANSFER' && e.to_address === BURN_ADDRESS) {
            return (
              <HistoryRow
                key={`t-${e.id}`}
                eventType={
                  <>
                    <BurnIcon size={14} />
                    <a
                      href={`https://tzkt.io/${e.ophash}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Burn
                    </a>
                  </>
                }
                from={<UsernameAndLink event={e} attr="from" />}
                to={
                  <span>
                    <Button href={`/tz/${encodeURI(BURN_ADDRESS)}`}>
                      Burn Address
                    </Button>
                  </span>
                }
                editions={e.amount}
                timestamp={e.timestamp}
              />
            )
          }

          if (e.type === 'HEN_MINT') {
            return (
              <HistoryRow
                key={`t-${e.id}`}
                eventType={
                  <>
                    <MintedIcon size={14} />
                    <div className={styles.history__mint__op}>Minted</div>
                  </>
                }
                editions={e.editions}
                timestamp={e.timestamp}
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
  )
}
