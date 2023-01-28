import { Navigate, useParams } from 'react-router'
import useSWR from 'swr'
import get from 'lodash/get'
import { PATH } from '@constants'
import { Page, Container } from '@atoms/layout'
import { Button } from '@atoms/button'
import TokenCollection from '@atoms/token-collection'
import styles from '@pages/profile/index.module.scss'
import { walletPreview } from '@utils/string'
import Identicon from '@atoms/identicons'
import { fetchCollabCreations } from '@data/api'
import collabStyles from '../index.module.scss'
import classNames from 'classnames'
import { CollaboratorType } from '@constants'
import ParticipantList from '../manage/ParticipantList'
import { useContext, useEffect } from 'react'
import { TeiaContext } from '@context/TeiaContext'
import { Loading } from '@atoms/loading/index'

export const CollabDisplay = () => {
  const { id, name } = useParams()

  const { setProfileFeed } = useContext(TeiaContext)
  useEffect(() => {
    setProfileFeed(true)
  }, [setProfileFeed])
  const { data, error } = useSWR(
    !id || !name ? ['/contract', id, name] : null,
    async () => {
      const result = await fetchCollabCreations(
        name || id,
        name ? 'subjkt' : 'address'
      )

      if (!result.split_contracts.length) {
        throw new Error('unknown split contract')
      }

      return {
        tokens: result.tokens,
        split_contract: result.split_contracts[0],
      }
    },
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
    }
  )

  if (error) {
    return (
      <Container>
        <pre>{JSON.stringify(error, null, 2)}</pre>
      </Container>
    )
  }

  if (!data) {
    return <Loading />
  }

  const { split_contract, tokens } = data

  const headerClass = classNames(
    styles.profile,
    collabStyles.mb4,
    collabStyles.pb2,
    collabStyles.borderBottom
  )

  const infoPanelClass = classNames(collabStyles.flex, collabStyles.flexBetween)
  const displayName =
    get(split_contract, 'contract_profile.name') ||
    get(split_contract, 'contract_address')
  const address = get(split_contract, 'contract_address')
  const description = get(
    split_contract,
    'contract_profile.metadata.data.description',
    ''
  )
  const logo = get(split_contract, 'contract_profile.metadata.data.identicon')
  const descriptionClass = classNames(collabStyles.pt1, collabStyles.muted)

  // Core participants
  const coreParticipants = get(split_contract, 'shareholders').filter(
    ({ holder_type }) => holder_type === CollaboratorType.CORE_PARTICIPANT
  )

  const oldContractAddresses = [
    'KT1CSfR6kx3uwDEXpwuCPnqp3MhpzfPmnLKj',
    'KT1XhXv6jBpkahnvrtdiSi8foWXneWEjcz6F',
  ]

  if (oldContractAddresses.indexOf(id) > -1) {
    return <Navigate to={`${PATH.ISSUER}/${id}`} replace />
  }

  return (
    <Page title={`Collab: ${displayName}`}>
      {/* <CollabHeader collaborators={collaborators} /> */}
      <Container>
        <div className={headerClass}>
          <Identicon address={address} logo={logo} />

          <div className={infoPanelClass} style={{ flex: 1 }}>
            <div>
              <div className={styles.info}>
                <h2>
                  <strong>{displayName}</strong>
                </h2>
              </div>

              <div className={styles.info}>
                {coreParticipants.length > 0 && (
                  <ParticipantList
                    title={false}
                    participants={coreParticipants}
                  />
                )}
              </div>

              <div className={styles.info}>
                {description && (
                  <p className={descriptionClass}>{description}</p>
                )}
                <Button href={`https://tzkt.io/${address}`}>
                  {walletPreview(address)}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Container>

      <Container xlarge>
        <TokenCollection
          namespace="collab-tokens"
          emptyMessage="This collab has no OBJKT creations to display"
          swrParams={[address]}
          query={{ tokens }}
        />
      </Container>
    </Page>
  )
}
