import { Outlet } from 'react-router-dom'
import { DAO_GOVERNANCE_CONTRACT } from '@constants'
import { useUserStore } from '@context/userStore'
import { Page } from '@atoms/layout'
import { Loading } from '@atoms/loading'
import { Tabs } from '@atoms/tab/Tabs'
import {
  useDaoTokenBalance,
  useStorage,
  useDaoRepresentatives,
} from '@data/swr'
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

export const DAO = () => {
  // Get all the required DAO information
  const daoStorage = useStorage(DAO_GOVERNANCE_CONTRACT)
  const representatives = useDaoRepresentatives(daoStorage)

  // Get all the required user information
  const userAddress = useUserStore((st) => st.address)
  const userCommunity = representatives?.[userAddress]
  const userTokenBalance = useDaoTokenBalance(userAddress)

  return (
    <Page title="Teia DAO">
      <div className={styles.headline}>
        <h1>Teia DAO</h1>
      </div>

      {!daoStorage || !representatives ? (
        <Loading message="Loading DAO information" />
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
    </Page>
  )
}
