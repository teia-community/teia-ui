// Moderation console tab

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@atoms/button'
import { Loading } from '@atoms/loading'
import { PATH } from '@constants'
import {
  profileAvatarUrl,
  setProfileHidden,
  useModeratableProfiles,
} from '@data/profiles'
import { walletPreview } from '@utils/string'
import ModerationTable from './ModerationTable'
import styles from '@style'

/** Profile cards (teiaProfiles) moderation tab: hide / unhide any card. */
export default function ProfilesAdmin() {
  const { data: profiles = [], isLoading } = useModeratableProfiles(true)
  const [busy, setBusy] = useState(null)

  const toggleHidden = async (p) => {
    setBusy(p.address)
    try {
      await setProfileHidden({ address: p.address, hidden: !p.hidden })
    } catch {
      // surfaced via the modal store
    } finally {
      setBusy(null)
    }
  }

  const renderRow = (p) => {
    const avatar = profileAvatarUrl(p.content?.identicon)
    return (
      <tr key={p.address} className={p.hidden ? styles.row_hidden : ''}>
        <td className={styles.cell_content}>
          <span className={styles.profile_cell}>
            {avatar && <img src={avatar} alt="" loading="lazy" />}
            {p.content?.name || (
              <span className={styles.muted}>
                {p.content ? 'No name' : 'Card document unavailable'}
              </span>
            )}
          </span>
          {p.hidden && <span className={styles.hidden_tag}> (hidden)</span>}
        </td>
        <td className={styles.mono}>
          <Link to={`${PATH.ISSUER}/${p.address}`}>
            {walletPreview(p.address)}
          </Link>
        </td>
        <td>{p.versionCount}</td>
        <td className={styles.row_actions}>
          <Button
            small
            shadow_box
            disabled={busy === p.address}
            onClick={() => toggleHidden(p)}
          >
            {p.hidden ? 'Unhide' : 'Hide'}
          </Button>
        </td>
      </tr>
    )
  }

  return (
    <div className={styles.tab_body}>
      <h3 className={styles.section_head}>Profile cards</h3>
      {isLoading ? (
        <Loading message="Loading profile cards…" />
      ) : (
        <ModerationTable
          items={profiles}
          headers={['Card', 'Wallet', 'Versions', 'Actions']}
          renderRow={renderRow}
          searchText={(p) => `${p.address} ${p.content?.name ?? ''}`}
          emptyLabel="No profile cards match."
        />
      )}
    </div>
  )
}
