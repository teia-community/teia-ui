import { Parser, emitMicheline } from '@taquito/michel-codec'
import { DAO_GOVERNANCE_CONTRACT, DAO_TOKEN_DECIMALS, TOKENS } from '@constants'
import { Page } from '@atoms/layout'
import { useUserStore } from '@context/userStore'
import { hexToString } from '@utils/string'
import { Button } from '@atoms/button'
import { TezosAddressLink, TokenLink, IpfsLink } from './links'
import styles from '@style'
import {
  useTokenBalance,
  useStorage,
  useGovernanceParameters,
  useProposals,
  useRepresentatives,
  useUserVotes,
  useCommunityVotes,
} from './hooks'

export function CreateDaoProposals() {
  return (
    <Page title="DAO proposals" large>
      <div className={styles.container}>
        <div className={styles.headline}>
          <h1>Create DAO proposals</h1>
        </div>
      </div>
    </Page>
  )
}
