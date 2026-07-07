import { Container } from '@atoms/layout'
import { useEffect, useState } from 'react'
import '../style.css'
import { HashToURL } from '@utils'
import { useObjktDisplayContext } from '..'
import { fetchTokenCopyrights, fetchCreatorAliases } from '@data/swr'
import axios from 'axios'
import styles from './Copyright.module.scss'

const CLAUSE_ROWS = [
  ['reproduce', 'Reproduce'],
  ['broadcast', 'Broadcast'],
  ['publicDisplay', 'Public Display'],
  ['createDerivativeWorks', 'Derivative Works'],
  ['requireAttribution', 'Attribution Required'],
  ['rightsAreTransferable', 'Transferable'],
  ['retainCreatorRights', 'Retain Creator Rights'],
  ['releasePublicDomain', 'Release to Public Domain'],
]

const EXCLUSIVE_LABELS = {
  none: 'None',
  majority: 'Majority share (50%+ editions)',
  superMajority: 'Super-majority share (66.7%+ editions)',
  creator: 'Creator',
  owner: 'Owner',
}

function fmtDate(value) {
  if (!value) return null
  const parsed = new Date(value)
  return isNaN(parsed.getTime())
    ? value
    : parsed.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
}

function isValidUrl(string) {
  try {
    new URL(string)
    return true
  } catch (_) {
    return false
  }
}

/** The rights ledger — every clause as an allowed/denied row. */
const RightsMatrix = ({ clauses }) => (
  <div className={styles.matrix}>
    {CLAUSE_ROWS.map(([key, label]) => {
      const value = clauses?.[key]
      if (typeof value !== 'boolean') return null
      return (
        <div className={styles.row} key={key}>
          <span className={styles.rowLabel}>{label}</span>
          <span className={styles.leader} />
          <span className={value ? styles.allow : styles.deny}>
            {value ? '✓ Allowed' : '✕ Denied'}
          </span>
        </div>
      )
    })}
  </div>
)

/** Exclusive-rights + expiration summary shared by on-chain and custom license. */
const LicenseFooter = ({ clauses }) => {
  const exclusive = clauses?.exclusiveRights
  const showExpiry = clauses?.expirationDateExists && clauses?.expirationDate
  if (!exclusive && !showExpiry) return null
  return (
    <div className={styles.footer}>
      {exclusive && (
        <span>
          Exclusive rights: <b>{EXCLUSIVE_LABELS[exclusive] || exclusive}</b>
        </span>
      )}
      {showExpiry && (
        <span>
          Expires <b>{fmtDate(clauses.expirationDate)}</b>
        </span>
      )}
    </div>
  )
}

export const Copyright = () => {
  const { nft } = useObjktDisplayContext()
  const [licenseData, setLicenseData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [copyrights, setCopyrights] = useState([])
  const [aliases, setAliases] = useState(new Map())

  const url = HashToURL(nft?.right_uri, 'CDN', { size: 'raw' })

  useEffect(() => {
    if (!url) {
      setIsLoading(false)
      return
    }

    axios
      .get(url)
      .then((response) => {
        setLicenseData(response.data)
        setHasError(false)
      })
      .catch((error) => {
        console.error('Failed to fetch data:', error)
        setHasError(true)
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [url])

  useEffect(() => {
    if (!nft?.fa2_address || nft?.token_id == null) return

    fetchTokenCopyrights(nft.fa2_address, nft.token_id).then((records) => {
      setCopyrights(records)
      const registrars = [...new Set(records.map((r) => r.key.address))]
      if (registrars.length) fetchCreatorAliases(registrars).then(setAliases)
    })
  }, [nft?.fa2_address, nft?.token_id])

  const isRegistered = copyrights.length > 0
  const isCustom = nft?.rights === 'custom'
  const hasPlainLicense =
    nft?.rights && nft.rights !== 'none' && nft.rights !== 'custom'

  const metadataLink = nft?.right_uri ? (
    <a
      href={isValidUrl(nft.right_uri) ? nft.right_uri : url}
      target="_blank"
      rel="noopener noreferrer"
      className={styles.link}
    >
      View metadata →
    </a>
  ) : null

  const renderMetadataLicense = () => {
    if (isLoading && url) {
      return <p className={styles.muted}>Loading license…</p>
    }

    if (isCustom && !hasError && licenseData) {
      const clauses = licenseData.clauses || {}
      return (
        <>
          <div className={styles.metaValue}>Custom license</div>
          <RightsMatrix clauses={clauses} />
          <LicenseFooter clauses={clauses} />
          {clauses.customUriEnabled && clauses.customUri && (
            <div className={styles.footerLinks}>
              <a
                href={clauses.customUri}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.link}
              >
                External terms →
              </a>
            </div>
          )}
          {clauses.addendum && (
            <>
              <div className={styles.subhead}>Addendum</div>
              <p className={styles.addendum}>{clauses.addendum}</p>
            </>
          )}
          {licenseData.documentText && (
            <>
              <div className={styles.subhead}>Full agreement</div>
              <div className={styles.doc}>{licenseData.documentText}</div>
            </>
          )}
          {metadataLink && (
            <div className={styles.footerLinks}>{metadataLink}</div>
          )}
        </>
      )
    }

    if (isCustom || hasPlainLicense) {
      return (
        <>
          <div className={styles.metaValue}>{nft.rights}</div>
          {metadataLink && (
            <div className={styles.footerLinks}>{metadataLink}</div>
          )}
        </>
      )
    }

    return (
      <p className={styles.muted}>
        No license declared in this token&apos;s metadata.
      </p>
    )
  }

  return (
    <Container>
      <div className={styles.tab}>
        <header className={styles.head}>
          <span className={styles.eyebrow}>Teia Copyright Registry</span>
          <span
            className={`${styles.status} ${
              isRegistered ? styles.statusOn : styles.statusOff
            }`}
          >
            <span />
            {isRegistered ? 'Registered on-chain' : 'Not registered'}
          </span>
        </header>

        {copyrights.map((entry) => {
          const registrar = entry.key.address
          const name =
            aliases.get(registrar) ||
            `${registrar.slice(0, 6)}…${registrar.slice(-4)}`
          const works = entry.value.related_tezos_nfts?.length || 0
          return (
            <div key={entry.id} className={styles.record}>
              <div className={styles.recordMeta}>
                <span>Registered by</span>
                <a
                  href={`/${aliases.get(registrar) || registrar}`}
                  className={styles.registrar}
                >
                  {name}
                </a>
                <span className={styles.sep}>·</span>
                <span>Record #{entry.key.nat}</span>
                <span className={styles.sep}>·</span>
                <span>
                  {works} work{works !== 1 ? 's' : ''} covered
                </span>
              </div>

              <RightsMatrix clauses={entry.value.clauses} />
              <LicenseFooter clauses={entry.value.clauses} />

              {entry.value.clauses.addendum && (
                <>
                  <div className={styles.subhead}>Registrant note</div>
                  <p className={styles.addendum}>
                    {entry.value.clauses.addendum}
                  </p>
                </>
              )}

              <div className={styles.footerLinks}>
                <a href="/copyrightmarketplace" className={styles.link}>
                  View in registry →
                </a>
              </div>
            </div>
          )
        })}

        <section className={styles.meta}>
          <span className={styles.metaEyebrow}>Token metadata license</span>
          {renderMetadataLicense()}
        </section>
      </div>
    </Container>
  )
}
