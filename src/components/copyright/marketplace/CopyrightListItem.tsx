import { useState } from 'react'
import type { CopyrightEntry } from '../shared/CopyrightTypes'
import ClausesPreview from '../shared/ClausesPreview'
import TokenCard from '../shared/TokenCard'
import AgreementViewer from '../shared/AgreementViewer'
import styles from './index.module.scss'
import sharedStyles from '../shared/index.module.scss'

interface CopyrightListItemProps {
  entry: CopyrightEntry
  aliases: Map<string, string>
}

const CLAUSE_DISPLAY: Array<{ key: string; label: string }> = [
  { key: 'reproduce', label: 'Reproduce' },
  { key: 'broadcast', label: 'Broadcast' },
  { key: 'publicDisplay', label: 'Public Display' },
  { key: 'createDerivativeWorks', label: 'Derivative Works' },
  { key: 'requireAttribution', label: 'Attribution Required' },
  { key: 'rightsAreTransferable', label: 'Transferable' },
  { key: 'retainCreatorRights', label: 'Retain Creator Rights' },
  { key: 'releasePublicDomain', label: 'Public Domain' },
]

export default function CopyrightListItem({ entry, aliases }: CopyrightListItemProps) {
  const [expanded, setExpanded] = useState(false)
  const [showFullText, setShowFullText] = useState(false)
  const { value } = entry
  const creators = value.creators || []
  const nfts = value.related_tezos_nfts || []
  const extLinks = value.related_external_nfts || []

  const creatorPreview = creators.slice(0, 2).map((addr) => aliases.get(addr) || addr.slice(0, 8) + '...').join(', ')
  const moreCount = creators.length > 2 ? creators.length - 2 : 0

  return (
    <div className={styles.listItem}>
      <button
        className={styles.listItemHeader}
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
      >
        <span className={styles.listItemId}>
          {creatorPreview}
          {moreCount > 0 && ` +${moreCount} more`}
        </span>
        <span className={styles.listItemCreators}>
          #{entry.key.nat}
        </span>
        <span className={styles.listItemBadges}>
          <ClausesPreview clauses={value.clauses} />
        </span>
        <span className={`${styles.listItemToggle} ${expanded ? styles.listItemToggleOpen : ''}`}>
          &#9654;
        </span>
      </button>

      {expanded && (
        <div className={styles.listItemBody}>
          {creators.length > 0 && (
            <>
              <h4 className={sharedStyles.sectionTitle}>Creators</h4>
              <div className={styles.creatorsSection}>
                {creators.map((addr) => (
                  <a key={addr} href={`/${aliases.get(addr) || addr}`} className={styles.creatorLink}>
                    {aliases.get(addr) || addr}
                  </a>
                ))}
              </div>
            </>
          )}

          <h4 className={sharedStyles.sectionTitle}>Clauses</h4>
          <div className={sharedStyles.clauseGrid}>
            {CLAUSE_DISPLAY.map(({ key, label }) => {
              const val = value.clauses[key as keyof typeof value.clauses]
              if (typeof val !== 'boolean') return null
              return (
                <div key={key} className={sharedStyles.clauseItem}>
                  <span className={sharedStyles.clauseLabel}>{label}</span>
                  <span className={val ? sharedStyles.clauseAllowed : sharedStyles.clauseDenied}>
                    {val ? 'Allowed' : 'Denied'}
                  </span>
                </div>
              )
            })}
            <div className={sharedStyles.clauseItem}>
              <span className={sharedStyles.clauseLabel}>Exclusive Rights</span>
              <span className={sharedStyles.clauseValue}>{value.clauses.exclusiveRights}</span>
            </div>
            {value.clauses.expirationDateExists && (
              <div className={sharedStyles.clauseItem}>
                <span className={sharedStyles.clauseLabel}>Expiration</span>
                <span className={sharedStyles.clauseValue}>{value.clauses.expirationDate || 'Set'}</span>
              </div>
            )}
          </div>

          {value.clauses.firstParagraph && (
            <>
              <h4 className={sharedStyles.sectionTitle}>Agreement</h4>
              <p className={sharedStyles.agreementText}>{value.clauses.firstParagraph}</p>
            </>
          )}

          {nfts.length > 0 && (
            <>
              <h4 className={sharedStyles.sectionTitle}>Registered Works</h4>
              <div className={sharedStyles.tokensGrid}>
                {nfts.map((nft) => (
                  <TokenCard
                    key={`${nft.contract}:${nft.token_id}`}
                    contract={nft.contract}
                    tokenId={nft.token_id}
                  />
                ))}
              </div>
            </>
          )}

          {value.clauses.addendum && (
            <>
              <h4 className={sharedStyles.sectionTitle}>Addendum</h4>
              <p className={sharedStyles.agreementText}>{value.clauses.addendum}</p>
            </>
          )}

          {extLinks.length > 0 && (
            <div className={sharedStyles.externalLinks}>
              <h4 className={sharedStyles.sectionTitle}>External Registrations</h4>
              {extLinks.map((url, i) => (
                <div key={i}>
                  <a href={url} target="_blank" rel="noopener noreferrer">{url}</a>
                </div>
              ))}
              <p className={sharedStyles.externalNote}>
                External URLs and URIs must be proven and maintained by the registrar.
              </p>
            </div>
          )}

          <button
            onClick={() => setShowFullText(!showFullText)}
            className={sharedStyles.fullTextButton}
          >
            {showFullText ? 'Hide Full Text' : 'Generate Full Text'}
          </button>
          {showFullText && <AgreementViewer firstParagraph={value.clauses.firstParagraph} />}
        </div>
      )}
    </div>
  )
}
