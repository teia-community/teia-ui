import { Outlet } from 'react-router-dom'
import { DAO_GOVERNANCE_CONTRACT } from '@constants'
import { useUserStore } from '@context/userStore'
import { Page } from '@atoms/layout'
import { Tabs } from '@atoms/tab'
import {
  useStorage,
  useDaoGovernanceParameters,
  useDaoProposals,
  useDaoRepresentatives,
  useDaoTokenBalance,
} from '@data/swr'
import LoadingDaoMessage from './LoadingDaoMessage'
import styles from '@style'

const TABS = [
  {
    title: 'Parameters',
    to: '',
  },
  {
    title: 'Proposals',
    to: 'proposals',
  },
  {
    title: 'Submit',
    to: 'submit',
    private: true,
  },
]

export default function DAO() {
  // Get all the required DAO information
  const [daoStorage] = useStorage(DAO_GOVERNANCE_CONTRACT)
  const [governanceParameters] = useDaoGovernanceParameters(daoStorage)
  const [proposals] = useDaoProposals(daoStorage)
  const [representatives] = useDaoRepresentatives(daoStorage)

  // Get all the required user information
  const userAddress = useUserStore((st) => st.address)
  const userCommunity = representatives?.[userAddress]
  const [userTokenBalance] = useDaoTokenBalance(userAddress)

  return (
    <Page title="Teia DAO">
      <div className={styles.container}>
        <h1 className={styles.headline}>Teia DAO</h1>

        {!governanceParameters || !proposals ? (
          <LoadingDaoMessage />
        ) : (
          <>
            <Tabs
              tabs={TABS}
              filter={(tab) => {
                if (userTokenBalance === 0 && !userCommunity && tab.private) {
                  return null
                }

                return tab
              }}
            />

            <Outlet />
          </>
        )}
      </div>
    </Page>
  )
}
