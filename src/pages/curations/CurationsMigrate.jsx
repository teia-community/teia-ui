import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Page, Container } from '@atoms/layout'
import { Button } from '@atoms/button'
import { Loading } from '@atoms/loading'
import { PATH, CURATION_CREATE_FEE, CURATIONS_CONTRACT } from '@constants'
import { useContractFee } from '@data/contract-fees'
import {
  useV1Migration,
  useCurationContent,
  migrateCurations,
} from '@data/curations'
import { useUserStore } from '@context/userStore'
import styles from '@style'

const tez = (mutez) => `${mutez / 1_000_000} ꜩ`

function MigrateRow({ curation, checked, onToggle, createFee }) {
  const { data: content } = useCurationContent(curation.cid)
  const title = content?.title || `Curation ${curation.id}`
  const migrated = curation.migratedTo != null
  return (
    <label className={styles.migrate_row}>
      <input
        type="checkbox"
        disabled={migrated}
        checked={migrated ? false : checked}
        onChange={() => onToggle(curation.cid)}
      />
      <span className={styles.migrate_title}>
        {title}
        <span className={styles.card_meta}>
          {' '}
          · old #{curation.id} · {content?.tokens?.length ?? '…'} tokens
        </span>
      </span>
      {migrated ? (
        <Link to={`${PATH.CURATIONS}/${curation.migratedTo}`}>
          migrated → #{curation.migratedTo}
        </Link>
      ) : (
        <span className={styles.card_meta}>{tez(createFee)}</span>
      )}
    </label>
  )
}

/**
 * Re-create the synced wallet's v3 curations on the v4 contract. Hidden v3
 * curations are excluded server-side; already-migrated ones are shown as links.
 */
export default function CurationsMigrate() {
  const createFee = useContractFee(
    CURATIONS_CONTRACT,
    'create_fee',
    CURATION_CREATE_FEE
  )
  const address = useUserStore((st) => st.address)
  const { curations, pending, error, isLoading, mutate } =
    useV1Migration(address)
  const [selected, setSelected] = useState(() => new Set())
  const [submitting, setSubmitting] = useState(false)

  const toggle = (cid) =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(cid)) next.delete(cid)
      else next.add(cid)
      return next
    })
  const pendingCids = pending.map((c) => c.cid)
  const chosen = pendingCids.filter((cid) => selected.has(cid))

  const onMigrate = async () => {
    if (chosen.length === 0 || submitting) return
    setSubmitting(true)
    try {
      await migrateCurations(chosen)
      setSelected(new Set())
      mutate()
    } catch {
      // surfaced via the modal store
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Page title="Migrate curations">
      <Container>
        <div className={styles.header}>
          <h1>Migrate curations</h1>
        </div>
        <p className={styles.detail_desc}>
          Curations created on the old contract are no longer listed. Re-create
          them on the new contract to keep them: each one costs {tez(createFee)}
          , you sign once for all selected, and the content is reused as-is.
          Hidden curations are not migrated.
        </p>

        {!address ? (
          <p className={styles.empty}>
            Sync your wallet to see your curations.
          </p>
        ) : isLoading ? (
          <Loading message="Loading old curations" />
        ) : error ? (
          <p className={styles.empty}>Could not load old curations.</p>
        ) : curations.length === 0 ? (
          <p className={styles.empty}>Nothing to migrate.</p>
        ) : (
          <>
            <div className={styles.migrate_list}>
              {curations.map((c) => (
                <MigrateRow
                  key={c.id}
                  curation={c}
                  checked={selected.has(c.cid)}
                  onToggle={toggle}
                  createFee={createFee}
                />
              ))}
            </div>
            <div className={styles.header}>
              <Button
                shadow_box
                disabled={chosen.length === 0 || submitting}
                onClick={onMigrate}
              >
                {submitting
                  ? 'Migrating…'
                  : `Migrate ${chosen.length} selected (${tez(
                      createFee * chosen.length
                    )})`}
              </Button>
              {pendingCids.length > 0 && (
                <Button
                  onClick={() =>
                    setSelected(
                      chosen.length === pendingCids.length
                        ? new Set()
                        : new Set(pendingCids)
                    )
                  }
                >
                  {chosen.length === pendingCids.length
                    ? 'Clear selection'
                    : 'Select all'}
                </Button>
              )}
            </div>
          </>
        )}
      </Container>
    </Page>
  )
}
