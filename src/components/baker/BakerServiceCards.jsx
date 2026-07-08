import { useBakerRegistryEntry } from '@data/swr'
import styles from './BakerServiceCards.module.scss'

const pct = (v) => (typeof v === 'number' ? `${+(v * 100).toFixed(2)}%` : '—')

const xtz = (v) =>
  typeof v === 'number' ? `${Math.round(v).toLocaleString()} ꜩ` : '—'

function Stat({ label, children }) {
  return (
    <div className={styles.stat}>
      <span className={styles.statLabel}>{label}</span>
      <span className={styles.statValue}>{children}</span>
    </div>
  )
}

function ServiceCard({ title, data }) {
  if (!data) return null
  return (
    <div className={styles.card}>
      <div className={styles.cardHead}>
        <h4 className={styles.cardTitle}>{title}</h4>
        <span className={data.enabled ? styles.open : styles.closed}>
          {data.enabled ? 'Open' : 'Closed'}
        </span>
      </div>
      <div className={styles.stats}>
        <Stat label="Fee">{pct(data.fee)}</Stat>
        <Stat label="Est. APY">{pct(data.estimatedApy)}</Stat>
        <Stat label="Free space">{xtz(data.freeSpace)}</Stat>
        <Stat label="Capacity">{xtz(data.capacity)}</Stat>
        <Stat label="Min delegation">
          {data.minBalance ? xtz(data.minBalance) : 'None'}
        </Stat>
      </div>
      {data.features?.length > 0 && (
        <div className={styles.features}>
          {data.features.map((f, i) => (
            <span key={i} className={styles.badge} title={f.content}>
              {f.title}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * Baking Bad registry detail (fee, APY, free space…) for delegation & staking.
 * Renders nothing when the baker isn't in the registry.
 */
export default function BakerServiceCards({ address }) {
  const [entry] = useBakerRegistryEntry(address)
  if (!entry) return null

  return (
    <div className={styles.cards}>
      <ServiceCard title="Delegation" data={entry.delegation} />
      <ServiceCard title="Staking" data={entry.staking} />
    </div>
  )
}
