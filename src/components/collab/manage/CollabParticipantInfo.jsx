import { Fragment } from 'react'
import get from 'lodash/get'
import { Button } from '@atoms/button'
import classNames from 'classnames'
import styles from '../index.module.scss'
import { CollaboratorType, PATH } from '@constants'
import ParticipantList from './ParticipantList'
import { Link } from 'react-router-dom'
import { useUserStore } from '@context/userStore'

export const CollabParticipantInfo = ({ collabData, expanded = false }) => {
  const [proxyAddress, address] = useUserStore((st) => [
    st.proxyAddress,
    st.address,
  ])

  const {
    administrator_address,
    contract_address,
    contract_profile,
    shareholders,
  } = collabData

  const isAdmin = address === administrator_address

  // Core participants
  const coreParticipants = shareholders.filter(
    ({ holder_type }) => holder_type === CollaboratorType.CORE_PARTICIPANT
  )

  // beneficiaries
  const beneficiaries = shareholders.filter(
    ({ holder_type }) => holder_type === CollaboratorType.BENEFACTOR
  )

  // Combine various styles
  const listStyle = classNames(
    styles.flex,
    styles.flexBetween,
    styles.alignStart,
    styles.mb2,
    {
      [styles.border]: contract_address === proxyAddress,
    }
  )

  const headerStyle = classNames(
    styles.flex,
    styles.flexBetween,
    styles.alignStart,
    styles.fullWidth
  )

  const name = get(contract_profile, 'name')
  const displayName = name || contract_address

  // TODO: Sort out better path naming in constants file for /kt vs. /collab
  const path = name ? `/collab/${name}` : `${PATH.COLLAB}/${contract_address}`
  return (
    <li className={listStyle} key={contract_address}>
      <div className={styles.fullWidth}>
        <div className={headerStyle}>
          {displayName && (
            <h3>
              <strong>
                <Link to={path}>{displayName}</Link>
              </strong>
            </h3>
          )}

          {contract_address !== proxyAddress && isAdmin && (
            <Button
              shadow_box
              onClick={() =>
                useUserStore.setState({
                  proxyAddress: contract_address,
                  proxyName: name,
                })
              }
            >
              sign in
            </Button>
          )}

          {contract_address === proxyAddress && isAdmin && (
            <Button
              shadow_box
              onClick={() =>
                useUserStore.setState({
                  proxyAddress: undefined,
                  proxyName: undefined,
                })
              }
            >
              sign out
            </Button>
          )}
        </div>

        {!name && isAdmin && (
          <p>
            to set the name of this collab,{' '}
            {contract_address !== proxyAddress ? 'sign in and' : ''} visit{' '}
            <Link to="/subjkt" style={{ textDecoration: 'underline' }}>
              settings
            </Link>
          </p>
        )}

        {expanded && (
          <Fragment>
            <p>
              <span className={styles.infoLabel}>address:</span>
              <Link
                className={styles.link}
                to={`${PATH.ISSUER}/${contract_address}`}
              >
                {contract_address}
              </Link>
            </p>{' '}
            {/* <span className={styles.muted}>(admin)</span> */}
            {coreParticipants.length > 0 && (
              <ParticipantList
                title="participants"
                participants={coreParticipants}
              />
            )}
            {beneficiaries.length > 0 && (
              <ParticipantList
                title="beneficiaries"
                participants={beneficiaries}
              />
            )}
          </Fragment>
        )}
      </div>
    </li>
  )
}
