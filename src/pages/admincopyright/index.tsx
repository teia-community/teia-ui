import { Page } from '@atoms/layout';
import SubmitProposal from '../../components/copyright/admin/SubmitProposal';
import ProposalList from '../../components/copyright/admin/ProposalList';
import styles from './index.module.scss'

export default function AdminCopyrightPage() {
  return (
    <Page title="Copyright Admin" className={styles.mainPage}>
      <div className={styles.pageContent}>
        <h1 className="text-3xl font-bold">©️ Copyright Proposals</h1>
        <SubmitProposal />
        <ProposalList />
      </div>
    </Page>
  );
}
