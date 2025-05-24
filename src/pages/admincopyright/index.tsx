import { Page } from '@atoms/layout';
import SubmitProposal from '../../components/copyright/admin/SubmitProposal';
import ProposalList from '../../components/copyright/admin/ProposalList';

export default function AdminCopyrightPage() {
  return (
    <Page title="Copyright Admin">
      <div className="space-y-8">
        <h1 className="text-3xl font-bold">Copyright Proposals</h1>
        <SubmitProposal />
        <ProposalList />
      </div>
    </Page>
  );
}
