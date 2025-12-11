import { useParams } from 'react-router-dom'
import { PATH, DAO_GOVERNANCE_CONTRACT } from '@constants'
import { Page } from '@atoms/layout'
import { RootErrorBoundary } from '@atoms/error'
import { PaginationButtons } from '@atoms/button'
import {
  useStorage,
  useDaoGovernanceParameters,
  useDaoProposals,
} from '@data/swr'
import LoadingDaoMessage from './LoadingDaoMessage'
import Proposal from './Proposal'
import styles from '@style'

export default function ProposalDisplay() {
  // Get all the required DAO information
  const [daoStorage] = useStorage(DAO_GOVERNANCE_CONTRACT)
  const [governanceParameters] = useDaoGovernanceParameters(daoStorage)
  const [proposals] = useDaoProposals(daoStorage)

  // Get the proposal id from the url
  const { id } = useParams()
  if (!id) {
    return (
      <RootErrorBoundary
        title="Invalid DAO proposal id"
        msg="Invalid or no proposal id provided"
      />
    )
  }

  // Return an error if the proposal doesn't exist
  if (proposals && !proposals[id]) {
    return (
      <RootErrorBoundary
        title="Invalid DAO proposal id"
        msg={`The last DAO proposal id is ${daoStorage.counter - 1}`}
      />
    )
  }

  return (
    <Page title={`DAO proposal #${id}`}>
      <div className={styles.container}>
        <h1 className={styles.headline}>DAO proposal</h1>
        {!governanceParameters || !proposals ? (
          <LoadingDaoMessage message="Loading proposal information" />
        ) : (
          <>
            <section className={styles.section}>
              <Proposal proposalId={id} />
            </section>

            <PaginationButtons
              path={PATH.PROPOSAL}
              current={parseInt(id)}
              min={0}
              max={daoStorage.counter - 1}
            />
          </>
        )}
      </div>
    </Page>
  )
}
