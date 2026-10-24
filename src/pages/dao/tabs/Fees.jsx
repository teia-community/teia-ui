import { Loading } from '@atoms/loading'
import { Line } from '@atoms/line'
import { TezosAddressLink } from '@atoms/link'
import { DAO_TREASURY_CONTRACT } from '@constants'
import { useTeiaFees } from '@data/teia-fees'
import styles from '@style'

function formatFee(fee) {
  if (fee.value == null) return '—'
  if (fee.unit === 'permille') {
    return `${(fee.value / 10).toLocaleString(undefined, {
      maximumFractionDigits: 2,
    })}%`
  }
  if (fee.value === 0) return 'Free'
  return `${(fee.value / 1_000_000).toLocaleString(undefined, {
    maximumFractionDigits: 6,
  })} tez`
}

function FeeRow({ fee }) {
  const isFree = fee.unit === 'mutez' && fee.value === 0
  return (
    <li className={styles.fee_row}>
      <span className={styles.fee_label}>{fee.label}</span>
      <span className={`${styles.fee_value} ${isFree ? styles.fee_free : ''}`}>
        {formatFee(fee)}
      </span>
    </li>
  )
}

const GOVERNANCE_NOTE = {
  'contract-vote': 'Changed by a vote of the core team inside this contract.',
  'multisig-proposal': 'Changed by a core team multisig proposal.',
}

export default function DaoFees() {
  const { groups, error, isLoading } = useTeiaFees()

  if (error) {
    return (
      <section className={styles.section}>
        <p>Error loading fees: {error.message}</p>
      </section>
    )
  }

  return (
    <>
      <section className={styles.section}>
        <h1 className={styles.section_title}>Fees on Teia</h1>
        <p className={styles.dao_intro}>
          Every fee Teia charges is listed here, read from the contract that
          charges it, so this page shows what is actually in force rather than
          what was last written down.
        </p>
        <p className={styles.dao_intro}>
          All of it goes to the DAO treasury, and the core team sets it: most
          contracts carry their own vote for their own fees, while the
          marketplace fee changes through a multisig proposal. Amounts exclude
          the Tezos network fee, which Teia does not receive.
        </p>
        <p className={styles.dao_intro}>
          Treasury: <TezosAddressLink address={DAO_TREASURY_CONTRACT} shorten />
        </p>
      </section>

      <Line />

      {isLoading && <Loading message="Reading fees from the contracts" />}

      {groups.map((group) => (
        <section className={styles.section} key={group.key}>
          <h1 className={styles.section_title}>{group.name}</h1>
          <ul className={styles.fee_list}>
            {group.fees.map((fee) => (
              <FeeRow key={fee.label} fee={fee} />
            ))}
          </ul>
          <p className={styles.fee_note}>
            {GOVERNANCE_NOTE[group.governedBy]}{' '}
            <TezosAddressLink address={group.address} shorten />
            {group.recipient && group.recipient !== DAO_TREASURY_CONTRACT && (
              <>
                {' · '}fees go to{' '}
                <TezosAddressLink address={group.recipient} shorten />
              </>
            )}
          </p>
        </section>
      ))}
    </>
  )
}
