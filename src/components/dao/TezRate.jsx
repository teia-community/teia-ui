import { useMemo } from 'react'
import { shallow } from 'zustand/shallow'
import { useLocalSettings } from '@context/localSettingsStore'
import { useTezQuote, CURRENCIES, currencyOf } from '@data/tez-quote'
import styles from './TezRate.module.scss'

/**
 * The rate used to read treasury amounts in money.
 *
 * It follows the published rate unless someone sets one, which matters for
 * reading an old vote at the rate that applied when it was taken.
 */
export function useTezRate() {
  const [currency, override] = useLocalSettings(
    (st) => [st.fiatCurrency, st.tezRateOverride],
    shallow
  )
  const { quote } = useTezQuote()

  return useMemo(() => {
    const live = quote?.rates?.[currency] ?? null
    const rate = override ?? live
    return {
      currency,
      rate,
      liveRate: live,
      isManual: override != null,
      quotedAt: quote?.timestamp ?? null,
    }
  }, [currency, override, quote])
}

/** Picker for the currency and the rate, shown above a list of amounts. */
export function TezRateControls() {
  const [currency, setCurrency, override, setOverride] = useLocalSettings(
    (st) => [
      st.fiatCurrency,
      st.setFiatCurrency,
      st.tezRateOverride,
      st.setTezRateOverride,
    ],
    shallow
  )
  const { rate, liveRate, isManual, quotedAt } = useTezRate()
  const label = currencyOf(currency).label

  return (
    <div className={styles.rate}>
      <label className={styles.rate_field}>
        <span>Show amounts in</span>
        <select
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
          aria-label="Currency for treasury amounts"
        >
          {CURRENCIES.map((c) => (
            <option key={c.key} value={c.key}>
              {c.label}
            </option>
          ))}
        </select>
      </label>

      <label className={styles.rate_field}>
        <span>1 ꜩ =</span>
        <input
          type="number"
          step="any"
          min="0"
          inputMode="decimal"
          value={rate ?? ''}
          placeholder={liveRate != null ? String(liveRate) : '—'}
          aria-label={`Tez price in ${label}`}
          onChange={(e) => {
            const next = e.target.value.trim()
            setOverride(next === '' ? null : Number(next))
          }}
        />
        <span>{label}</span>
      </label>

      {isManual ? (
        <button
          type="button"
          className={styles.rate_reset}
          onClick={() => setOverride(null)}
        >
          Use the published rate
        </button>
      ) : (
        quotedAt && (
          <span className={styles.rate_note}>
            published {new Date(quotedAt).toLocaleString()}
          </span>
        )
      )}
    </div>
  )
}

export default TezRateControls
