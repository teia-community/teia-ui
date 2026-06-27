import {
  CHANNEL_FEE,
  CHANNEL_MESSAGE_FEE,
  POLL_MESSAGE_FEE,
  TOKEN_MESSAGE_FEE,
  CHANNELS_V2_CONTRACT,
  POLL_COMMENTS_CONTRACT,
  TOKEN_COMMENTS_CONTRACT,
  WIKI_CONTRACT,
} from '@constants'
import { Line } from '@atoms/line'
import { TezosAddressLink } from '@atoms/link'
import { useWikiFees } from '@data/wiki/fees'
import styles from '@style'

function FeeRow({ label, mutez, loading }) {
  const isFree = mutez === 0
  return (
    <li className={styles.fee_row}>
      <span className={styles.fee_label}>{label}</span>
      <span className={`${styles.fee_value} ${isFree ? styles.fee_free : ''}`}>
        {loading
          ? 'loading…'
          : mutez == null
          ? '—'
          : isFree
          ? 'Free'
          : `${mutez / 1_000_000} tez`}
      </span>
    </li>
  )
}

const CONTRACTS = [
  { name: 'Channels', address: CHANNELS_V2_CONTRACT },
  { name: 'Poll comments', address: POLL_COMMENTS_CONTRACT },
  { name: 'Token comments', address: TOKEN_COMMENTS_CONTRACT },
  { name: 'Wiki', address: WIKI_CONTRACT },
]

export default function DaoFees() {
  const { data: wikiFees, isLoading: loadingWikiFees } = useWikiFees()

  return (
    <>
      <section className={styles.section}>
        <h1 className={styles.section_title}>Fees on Teia</h1>
        <p>
          This page lists every fee currently applied, so the community can see
          exactly what is charged and where.
        </p>
        <p>
          These amounts do not include the standard Tezos network (gas) fee.
        </p>
      </section>

      <Line />

      <section className={styles.section}>
        <h1 className={styles.section_title}>Messaging (Channels & DMs)</h1>
        <ul className={styles.fee_list}>
          <FeeRow label="Channel creation" mutez={CHANNEL_FEE} />
          <FeeRow label="DM creation" mutez={CHANNEL_FEE} />
          <FeeRow label="Message" mutez={CHANNEL_MESSAGE_FEE} />
          <FeeRow label="Message edit" mutez={0} />
        </ul>
      </section>

      <section className={styles.section}>
        <h1 className={styles.section_title}>Comments</h1>
        <ul className={styles.fee_list}>
          <FeeRow label="Poll comment" mutez={POLL_MESSAGE_FEE} />
          <FeeRow label="Token (artwork) comment" mutez={TOKEN_MESSAGE_FEE} />
        </ul>
      </section>

      <section className={styles.section}>
        <h1 className={styles.section_title}>Wiki</h1>
        <ul className={styles.fee_list}>
          <FeeRow
            label="Propose a new page"
            mutez={wikiFees?.proposePageFee}
            loading={loadingWikiFees}
          />
          <FeeRow
            label="Propose an edit"
            mutez={wikiFees?.proposeEditFee}
            loading={loadingWikiFees}
          />
          <FeeRow label="Moderator / multisig edits" mutez={0} />
        </ul>
      </section>

      <Line />

      <div className={styles.contracts_box}>
        <h2 className={styles.contracts_box_title}>Contracts</h2>
        <ul className={styles.contracts_list}>
          {CONTRACTS.map(({ name, address }) => (
            <li key={address} className={styles.contract_row}>
              <span className={styles.contract_name}>{name}</span>
              <TezosAddressLink address={address} shorten />
            </li>
          ))}
        </ul>
      </div>
    </>
  )
}
