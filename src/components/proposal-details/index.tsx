import { TOKENS } from '@constants'
import { TezosAddressLink } from '@atoms/link'
import styles from '@style'

export function Details({ label, className, children }) {
  return (
    <details className={`${styles.details} ${className ?? ''}`}>
      <summary>{label}</summary>
      <div className={styles.container}>{children}</div>
    </details>
  )
}

export function TezTansfersDetails({ label, transfers, aliases, className }) {
  return (
    <Details label={label} className={className}>
      <table className={styles.transfers}>
        <tbody>
          {transfers.map((transfer, index) => (
            <tr key={index}>
              <td>{transfer.amount / 1e6} tez</td>
              <td>
                to{' '}
                <TezosAddressLink
                  address={transfer.destination}
                  alias={aliases?.[transfer.destination]}
                  shorten
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Details>
  )
}

export function TokenTansfersDetails({
  label,
  fa2,
  transfers,
  aliases,
  className,
}) {
  const token = TOKENS.find((token) => token.fa2 === fa2)
  const decimals = token?.decimals ?? 1

  return (
    <Details label={label} className={className}>
      <table className={styles.transfers}>
        <tbody>
          {transfers.map((transfer, index) => (
            <tr key={index}>
              <td>
                {transfer.amount / decimals}{' '}
                {!token || token.multiasset
                  ? `edition${transfer.amount / decimals === 1 ? '' : 's'}`
                  : token.name}
              </td>
              <td>
                to{' '}
                <TezosAddressLink
                  address={transfer.destination}
                  alias={aliases?.[transfer.destination]}
                  shorten
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Details>
  )
}

export function CodeDetails({ label, code, className }) {
  return (
    <Details label={label} className={className}>
      <pre className={styles.code}>{code}</pre>
    </Details>
  )
}
