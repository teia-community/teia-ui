import { useState } from 'react'
import { DAO_GOVERNANCE_CONTRACT, DAO_TOKEN_DECIMALS, TOKENS } from '@constants'
import { useUserStore } from '@context/userStore'
import { useDaoStore } from '@context/daoStore'
import { Page } from '@atoms/layout'
import { Loading } from '@atoms/loading'
import { Button } from '@atoms/button'
import { Line } from '@atoms/line'
import { Input, Textarea } from '@atoms/input'
import styles from '@style'
import { useTokenBalance, useStorage, useGovernanceParameters } from './hooks'

export function CreateDaoProposals() {
  // Get all the required DAO information
  const daoStorage = useStorage(DAO_GOVERNANCE_CONTRACT)
  const governanceParameters = useGovernanceParameters(daoStorage)

  // Get all the required user information
  const userAddress = useUserStore((st) => st.address)
  const userTokenBalance = useTokenBalance(userAddress)

  // Display the loading page information until all data is available
  if (!daoStorage || !governanceParameters) {
    return (
      <Page title="Create new DAO proposals" large>
        <Loading message="Loading DAO information" />
      </Page>
    )
  }

  // Get the minimum number of tokens needed to create proposals
  const currentGovernanceParameters =
    governanceParameters[daoStorage.gp_counter - 1]
  const minimumTokensToCreateProposals =
    currentGovernanceParameters.escrow_amount / DAO_TOKEN_DECIMALS

  return (
    <Page title="Create new DAO proposals" large>
      <div className={styles.container}>
        <div className={styles.headline}>
          <h1>Create new DAO proposals</h1>
        </div>

        {userTokenBalance === 0 ||
        userTokenBalance < minimumTokensToCreateProposals ? (
          <section className={styles.section}>
            {userTokenBalance === 0 ? (
              <p>Only DAO members can create proposals.</p>
            ) : (
              <p>
                A minimum of {minimumTokensToCreateProposals} TEIA tokens are
                needed to create proposals.
              </p>
            )}
          </section>
        ) : (
          <>
            <section className={styles.section}>
              <h1 className={styles.section_title}>Text proposal</h1>
              <p>
                Use this form to create a proposal to approve a text or
                decission.
              </p>
              <p>
                This proposal has no direct consequences on the blockchain.
                However, if accepted and executed, it should trigger some
                off-chain actions by one of the Teia DAO members (e.g. change a
                website UI, decide on a dog name, buy bread at the bakery). The
                proposal description will be stored in IPFS for archival
                purposes.
              </p>
              <TextProposalForm />
            </section>

            <section className={styles.section}>
              <h1 className={styles.section_title}>Transfer tez proposal</h1>
              <p>
                Use this form to create a proposal that, if accepted, it will
                transfer the specified amount of tez from the DAO treasury to a
                list of tezos addresses. The proposal description will be stored
                in IPFS for archival purposes.
              </p>
              <TransferTezProposalForm />
            </section>

            <section className={styles.section}>
              <h1 className={styles.section_title}>Transfer token proposal</h1>
              <p>
                Use this form to create a proposal that, if accepted, it will
                transfer the specified amount of token editions from the DAO
                treasury to a list of tezos addresses. The proposal description
                will be stored in IPFS for archival purposes.
              </p>
              <TransferTokenProposalForm />
            </section>

            <section className={styles.section}>
              <h1 className={styles.section_title}>Lambda function proposal</h1>
              <p>
                Use this form to create a proposal that, if accepted, it will
                execute some smart contract code stored in a Michelson lambda
                function. The proposal description will be stored in IPFS for
                archival purposes.
              </p>
              <p>
                This proposal could be used to administer other smart contracts
                of which the DAO is the administrator (e.g. to update the Teia
                marketplace fees), or to execute entry points from other
                contracts (e.g. swap or collect a token, vote in anoter DAO /
                multisig).
              </p>
              <p>
                Warning: Executing arbitrary smart contract code could
                compromise the DAO or have unexpected consequences. The lambda
                function code should have been revised by some trusted smart
                contract expert before the proposal is accepted and executed.
              </p>
              <LambdaFunctionProposalForm />
            </section>
          </>
        )}
      </div>
    </Page>
  )
}

function CommonProposalFields({
  title,
  setTitle,
  descriptionIpfsCid,
  setDescriptionIpfsCid,
}) {
  // Set the component state
  const [descriptionFile, setDescriptionFile] = useState(undefined)

  // Get the upload method from the DAO store
  const uploadFileToIpfs = useDaoStore((st) => st.uploadFileToIpfs)

  // Define the on change handler
  const handleChange = (e) => {
    setDescriptionFile(e.target.files[0])
    setDescriptionIpfsCid('')
  }

  // Define the on click handler
  const handleClick = async (e) => {
    e.preventDefault()
    if (descriptionIpfsCid !== '') return
    setDescriptionIpfsCid(await uploadFileToIpfs(descriptionFile, true))
  }

  return (
    <>
      <Input
        type="text"
        name="proposalTitle"
        label="Proposal title"
        placeholder="Write here a meaningful title for your proposal"
        maxlength="500"
        value={title}
        onChange={setTitle}
        className={styles.proposal_form_field}
      >
        <Line />
      </Input>

      <div className={styles.proposal_form_field}>
        <p className={styles.proposal_description_label}>
          Proposal description
        </p>
        <label className={styles.upload_button}>
          {descriptionFile
            ? descriptionFile.name
            : 'Select the file with the proposal description'}
          <input type="file" onChange={handleChange} />
        </label>
        {descriptionFile && (
          <button className={styles.upload_button} onClick={handleClick}>
            {descriptionIpfsCid !== ''
              ? `${descriptionFile.name} has been uploaded to IPFS`
              : `Upload ${descriptionFile.name} to IPFS`}
          </button>
        )}
      </div>
    </>
  )
}

function TextProposalForm() {
  // Set the component state
  const [title, setTitle] = useState('')
  const [descriptionIpfsCid, setDescriptionIpfsCid] = useState('')

  // Get the create proposal method from the DAO store
  const createTextProposal = useDaoStore((st) => st.createTextProposal)

  // Define the on submit handler
  const handleSubmit = (e) => {
    e.preventDefault()
    createTextProposal(title, descriptionIpfsCid)
  }

  return (
    <form className={styles.proposal_form} onSubmit={handleSubmit}>
      <CommonProposalFields
        title={title}
        setTitle={setTitle}
        descriptionIpfsCid={descriptionIpfsCid}
        setDescriptionIpfsCid={setDescriptionIpfsCid}
      />

      <Button shadow_box fit>
        Submit proposal
      </Button>
    </form>
  )
}

function TransferTezProposalForm() {
  // Set the component state
  const [title, setTitle] = useState('')
  const [descriptionIpfsCid, setDescriptionIpfsCid] = useState('')
  const [transfers, setTransfers] = useState([{ amount: 0, destination: '' }])

  // Get the create proposal method from the DAO store
  const createTransferMutezProposal = useDaoStore(
    (st) => st.createTransferMutezProposal
  )

  // Define the on change handler
  const handleChange = (index, parameter, value) => {
    // Create a new transfers array
    const newTransfers = transfers.map((transfer) => ({
      amount: transfer.amount,
      destination: transfer.destination,
    }))

    // Update the value
    newTransfers[index][parameter] = value

    // Update the component state
    setTransfers(newTransfers)
  }

  // Define the on click handler
  const handleClick = (e, increase) => {
    e.preventDefault()

    // Create a new transfers array
    const newTransfers = transfers.map((transfer) => ({
      amount: transfer.amount,
      destination: transfer.destination,
    }))

    // Add or remove a transfer from the list
    if (increase) {
      newTransfers.push({ amount: 0, destination: '' })
    } else if (newTransfers.length > 1) {
      newTransfers.pop()
    }

    // Update the component state
    setTransfers(newTransfers)
  }

  // Define the on submit handler
  const handleSubmit = (e) => {
    e.preventDefault()
    createTransferMutezProposal(
      title,
      descriptionIpfsCid,
      transfers.map((transfer) => ({
        amount: transfer.amount * 1000000,
        destination: transfer.destination,
      }))
    )
  }

  return (
    <form className={styles.proposal_form} onSubmit={handleSubmit}>
      <CommonProposalFields
        title={title}
        setTitle={setTitle}
        descriptionIpfsCid={descriptionIpfsCid}
        setDescriptionIpfsCid={setDescriptionIpfsCid}
      />

      <div className={styles.transfers_fields}>
        {transfers.map((transfer, index) => (
          <div key={index}>
            <Input
              type="number"
              name={`transferTezAmount${index}`}
              label={`Amount to transfer in tez (${index + 1})`}
              placeholder="0"
              value={transfer.amount}
              onChange={(value) => handleChange(index, 'amount', value)}
              className={styles.proposal_form_field}
            >
              <Line />
            </Input>

            <Input
              type="text"
              name={`transferTezDestination${index}`}
              label={`Destination address (${index + 1})`}
              placeholder="tz1..."
              value={transfer.destination}
              onChange={(value) => handleChange(index, 'destination', value)}
              className={styles.proposal_form_field}
            >
              <Line />
            </Input>
          </div>
        ))}
        <Button shadow_box inline onClick={(e) => handleClick(e, true)}>
          +
        </Button>
        <Button shadow_box inline onClick={(e) => handleClick(e, false)}>
          -
        </Button>
      </div>

      <Button shadow_box fit>
        Submit proposal
      </Button>
    </form>
  )
}

function TransferTokenProposalForm() {
  // Set the component state
  const [title, setTitle] = useState('')
  const [descriptionIpfsCid, setDescriptionIpfsCid] = useState('')
  const [tokenContract, setTokenContract] = useState('')
  const [tokenId, setTokenId] = useState(0)
  const [transfers, setTransfers] = useState([{ amount: 0, destination: '' }])

  // Get the create proposal method from the DAO store
  const createTransferTokenProposal = useDaoStore(
    (st) => st.createTransferTokenProposal
  )

  // Define the on change handler
  const handleChange = (index, parameter, value) => {
    // Create a new transfers array
    const newTransfers = transfers.map((transfer) => ({
      amount: transfer.amount,
      destination: transfer.destination,
    }))

    // Update the value
    newTransfers[index][parameter] = value

    // Update the component state
    setTransfers(newTransfers)
  }

  // Define the on click handler
  const handleClick = (e, increase) => {
    e.preventDefault()

    // Create a new transfers array
    const newTransfers = transfers.map((transfer) => ({
      amount: transfer.amount,
      destination: transfer.destination,
    }))

    // Add or remove a transfer from the list
    if (increase) {
      newTransfers.push({ amount: 0, destination: '' })
    } else if (newTransfers.length > 1) {
      newTransfers.pop()
    }

    // Update the component state
    setTransfers(newTransfers)
  }

  // Define the on submit handler
  const handleSubmit = (e) => {
    e.preventDefault()

    // Create a new transfers array that makes use of the correct decimals
    const token = TOKENS.find((token) => token.fa2 === tokenContract)
    const newTransfers = transfers.map((transfer) => ({
      amount: token ? transfer.amount * token.decimals : transfer.amount,
      destination: transfer.destination,
    }))

    // Submit the proposal
    createTransferTokenProposal(
      title,
      descriptionIpfsCid,
      tokenContract,
      tokenId,
      newTransfers
    )
  }

  return (
    <form className={styles.proposal_form} onSubmit={handleSubmit}>
      <CommonProposalFields
        title={title}
        setTitle={setTitle}
        descriptionIpfsCid={descriptionIpfsCid}
        setDescriptionIpfsCid={setDescriptionIpfsCid}
      />

      <Input
        type="text"
        name="tokenContractAddress"
        label="Token contract address"
        placeholder="KT..."
        value={tokenContract}
        onChange={setTokenContract}
        className={styles.proposal_form_field}
      >
        <Line />
      </Input>

      <Input
        type="number"
        name="tokenId"
        label="Token id"
        placeholder="0"
        step="1"
        value={tokenId}
        onChange={setTokenId}
        className={styles.proposal_form_field}
      >
        <Line />
      </Input>

      <div className={styles.transfers_fields}>
        {transfers.map((transfer, index) => (
          <div key={index}>
            <Input
              type="number"
              name={`tokenEditions${index}`}
              label={`Token editions (${index})`}
              placeholder="0"
              value={transfer.amount}
              onChange={(value) => handleChange(index, 'amount', value)}
              className={styles.proposal_form_field}
            >
              <Line />
            </Input>
            <Input
              type="text"
              name={`tokenDestination${index}`}
              label={`Destination address (${index})`}
              placeholder="tz1..."
              value={transfer.destination}
              onChange={(value) => handleChange(index, 'destination', value)}
              className={styles.proposal_form_field}
            >
              <Line />
            </Input>
          </div>
        ))}
        <Button shadow_box inline onClick={(e) => handleClick(e, true)}>
          +
        </Button>
        <Button shadow_box inline onClick={(e) => handleClick(e, false)}>
          -
        </Button>
      </div>

      <Button shadow_box fit>
        Submit proposal
      </Button>
    </form>
  )
}

function LambdaFunctionProposalForm() {
  // Set the component state
  const [title, setTitle] = useState('')
  const [descriptionIpfsCid, setDescriptionIpfsCid] = useState('')
  const [michelineCode, setMichelineCode] = useState('')

  // Get the create proposal method from the DAO store
  const createLambdaFunctionProposal = useDaoStore(
    (st) => st.createLambdaFunctionProposal
  )

  // Define the on submit handler
  const handleSubmit = (e) => {
    e.preventDefault()
    createLambdaFunctionProposal(title, descriptionIpfsCid, michelineCode)
  }

  return (
    <form className={styles.proposal_form} onSubmit={handleSubmit}>
      <CommonProposalFields
        title={title}
        setTitle={setTitle}
        descriptionIpfsCid={descriptionIpfsCid}
        setDescriptionIpfsCid={setDescriptionIpfsCid}
      />

      <Textarea
        name="lambdaFunctionCode"
        label="Lambda function code in Micheline format"
        placeholder="Write here the lambda function code"
        value={michelineCode}
        onChange={(e) => setMichelineCode(e.value)}
        className={styles.proposal_form_field}
      >
        <Line />
      </Textarea>

      <Button shadow_box fit>
        Submit proposal
      </Button>
    </form>
  )
}
