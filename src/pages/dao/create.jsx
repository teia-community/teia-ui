import { useState } from 'react'
import { DAO_GOVERNANCE_CONTRACT, DAO_TOKEN_DECIMALS, TOKENS } from '@constants'
import { useUserStore } from '@context/userStore'
import { useDaoStore } from '@context/daoStore'
import { Page } from '@atoms/layout'
import { Loading } from '@atoms/loading'
import { Button } from '@atoms/button'
import { Line } from '@atoms/line'
import styles from '@style'
import { IpfsLink } from './links'
import { useTokenBalance, useStorage, useGovernanceParameters } from './hooks'

export function CreateDaoProposals() {
  // Get all the required DAO information
  const daoStorage = useStorage(DAO_GOVERNANCE_CONTRACT)
  const governanceParameters = useGovernanceParameters(daoStorage)

  // Get all the required user information
  const userAddress = useUserStore((st) => st.address)
  const userTokenBalance = useTokenBalance(userAddress)

  // Get the contract call methods from the DAO store
  const createTextProposal = useDaoStore((st) => st.createTextProposal)
  const createTransferMutezProposal = useDaoStore(
    (st) => st.createTransferMutezProposal
  )
  const createTransferTokenProposal = useDaoStore(
    (st) => st.createTransferTokenProposal
  )
  const createLambdaFunctionProposal = useDaoStore(
    (st) => st.createLambdaFunctionProposal
  )

  // Display the loading page information until all data is available
  if (!daoStorage || !governanceParameters)
    return (
      <Page title="Create DAO proposals" large>
        <Loading message="loading DAO information" />
      </Page>
    )

  // Get the current governance parameters
  const currentGovernanceParameters =
    governanceParameters[daoStorage.gp_counter - 1]

  // Return if the user doesn't have enough balance to create proposals
  if (
    userTokenBalance == 0 ||
    currentGovernanceParameters.escrow_amount / DAO_TOKEN_DECIMALS >
      userTokenBalance
  ) {
    return (
      <Page title="Create DAO proposals" large>
        <div className={styles.container}>
          <div className={styles.headline}>
            <h1>Create DAO proposals</h1>
            <p>
              A minimum of{' '}
              {currentGovernanceParameters.escrow_amount / DAO_TOKEN_DECIMALS}{' '}
              TEIA tokens are needed to create proposals.
            </p>
          </div>
        </div>
      </Page>
    )
  }

  return (
    <Page title="Create DAO proposals" large>
      <div className={styles.container}>
        <div className={styles.headline}>
          <h1>Create DAO proposals</h1>
        </div>

        <section className={styles.section}>
          <h1 className={styles.section_title}>Text proposal</h1>
          <p>
            Use this form to create a proposal to approve a text or decission.
          </p>
          <p>
            This proposal has no direct consequences on the blockchain. However,
            if accepted and executed, it should trigger some off-chain actions
            by one of the Teia DAO members (e.g. change a website UI, decide on
            a dog name, buy bread at the bakery). The proposal description will
            be stored in IPFS for archival purposes.
          </p>
          <TextProposalForm handleSubmit={createTextProposal} />
        </section>

        <Line />

        <section className={styles.section}>
          <h1 className={styles.section_title}>Transfer tez proposal</h1>
          <p>
            Use this form to create a proposal that, if accepted, it will
            transfer the specified amount of tez from the DAO treasury to a list
            of tezos addresses. The proposal description will be stored in IPFS
            for archival purposes.
          </p>
          <TransferTezProposalForm handleSubmit={createTransferMutezProposal} />
        </section>

        <Line />

        <section className={styles.section}>
          <h1 className={styles.section_title}>Transfer token proposal</h1>
          <p>
            Use this form to create a proposal that, if accepted, it will
            transfer the specified amount of token editions from the DAO
            treasury to a list of tezos addresses. The proposal description will
            be stored in IPFS for archival purposes.
          </p>
          <TransferTokenProposalForm
            handleSubmit={createTransferTokenProposal}
          />
        </section>

        <Line />

        <section className={styles.section}>
          <h1 className={styles.section_title}>Lambda function proposal</h1>
          <p>
            Use this form to create a proposal that, if accepted, it will
            execute some smart contract code stored in a Michelson lambda
            function. The proposal description will be stored in IPFS for
            archival purposes.
          </p>
          <p>
            This proposal could be used to administer other smart contracts of
            which the DAO is the administrator (e.g. to update some smart
            contract fees), or to execute entry points from other contracts
            (e.g. swap or collect a token, vote in anoter DAO / multisig).
          </p>
          <p className={styles.create_proposal_warning}>
            Warning: Executing arbitrary smart contract code could compromise
            the DAO or have unexpected consequences. The lambda function code
            should have been revised by some trusted smart contract expert
            before the proposal is accepted and executed.
          </p>
          <LambdaFunctionProposalForm
            handleSubmit={createLambdaFunctionProposal}
          />
        </section>
      </div>
    </Page>
  )
}

function GeneralProposalInputs(props) {
  // Set the component state
  const [descriptionFile, setDescriptionFile] = useState(undefined)

  // Get the upload file method from the DAO store
  const uploadFileToIpfs = useDaoStore((st) => st.uploadFileToIpfs)

  // Define the on change handler
  const handleChange = (e) => {
    setDescriptionFile(e.target.files[0])
    props.setDescriptionIpfsPath(undefined)
  }

  // Define the on click handler
  const handleClick = async (e) => {
    e.preventDefault()

    // Update the component state
    props.setDescriptionIpfsPath(await uploadFileToIpfs(descriptionFile, true))
  }

  return (
    <>
      <label>
        Proposal title:{' '}
        <input
          type="text"
          placeholder="write here"
          spellCheck="false"
          minLength="1"
          value={props.title}
          onChange={(e) => props.setTitle(e.target.value)}
        />
      </label>
      <br />
      <label>
        Proposal description: <input type="file" onChange={handleChange} />
      </label>
      {descriptionFile && (
        <div>
          <Button shadow_box onClick={handleClick}>
            {props.descriptionIpfsPath ? 'uploaded' : 'upload to IPFS'}
          </Button>{' '}
          {props.descriptionIpfsPath && (
            <IpfsLink path={props.descriptionIpfsPath} />
          )}
        </div>
      )}
    </>
  )
}

function TextProposalForm(props) {
  // Set the component state
  const [title, setTitle] = useState('')
  const [descriptionIpfsPath, setDescriptionIpfsPath] = useState(undefined)

  // Define the on submit handler
  const handleSubmit = (e) => {
    e.preventDefault()
    props.handleSubmit(title, descriptionIpfsPath)
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className={styles.form_input}>
        <GeneralProposalInputs
          title={title}
          setTitle={setTitle}
          descriptionIpfsPath={descriptionIpfsPath}
          setDescriptionIpfsPath={setDescriptionIpfsPath}
        />
      </div>
      <Button shadow_box>send proposal</Button>
    </form>
  )
}

function TransferTezProposalForm(props) {
  // Set the component state
  const [title, setTitle] = useState('')
  const [descriptionIpfsPath, setDescriptionIpfsPath] = useState(undefined)
  const [transfers, setTransfers] = useState([{ amount: 0, destination: '' }])

  // Define the on change handler
  const handleChange = (index, parameter, value) => {
    // Create a new transfers array
    const newTransfers = transfers.map((transfer, i) => {
      // Create a new transfer
      const newTransfer = {
        amount: transfer.amount,
        destination: transfer.destination,
      }

      // Update the value if we are at the correct index position
      if (i === index) {
        newTransfer[parameter] = value
      }

      return newTransfer
    })

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
    props.handleSubmit(
      title,
      descriptionIpfsPath,
      transfers.map((transfer) => ({
        amount: transfer.amount * 1000000,
        destination: transfer.destination,
      }))
    )
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className={styles.form_input}>
        <GeneralProposalInputs
          title={title}
          setTitle={setTitle}
          descriptionIpfsPath={descriptionIpfsPath}
          setDescriptionIpfsPath={setDescriptionIpfsPath}
        />
        <br />
        <div className={styles.transfers_input}>
          {transfers.map((transfer, index) => (
            <div key={index} className={styles.transfer_input}>
              <label>
                Amount to transfer (ꜩ):{' '}
                <input
                  type="number"
                  min="0"
                  step="0.000001"
                  value={transfer.amount}
                  onChange={(e) =>
                    handleChange(index, 'amount', e.target.value)
                  }
                />
              </label>
              <br />
              <label>
                Destination address:{' '}
                <input
                  type="text"
                  placeholder="tz1..."
                  spellCheck="false"
                  minLength="36"
                  maxLength="36"
                  className={styles.tezos_wallet_input}
                  value={transfer.destination}
                  onChange={(e) =>
                    handleChange(index, 'destination', e.target.value)
                  }
                />
              </label>
            </div>
          ))}
        </div>
        <Button shadow_box inline onClick={(e) => handleClick(e, true)}>
          +
        </Button>
        <Button shadow_box inline onClick={(e) => handleClick(e, false)}>
          -
        </Button>
      </div>
      <Button shadow_box>send proposal</Button>
    </form>
  )
}

function TransferTokenProposalForm(props) {
  // Set the component state
  const [title, setTitle] = useState('')
  const [descriptionIpfsPath, setDescriptionIpfsPath] = useState(undefined)
  const [tokenContract, setTokenContract] = useState('')
  const [tokenId, setTokenId] = useState('')
  const [transfers, setTransfers] = useState([{ amount: 0, destination: '' }])

  // Define the on change handler
  const handleChange = (index, parameter, value) => {
    // Create a new transfers array
    const newTransfers = transfers.map((transfer, i) => {
      // Create a new transfer
      const newTransfer = {
        amount: transfer.amount,
        destination: transfer.destination,
      }

      // Update the value if we are at the correct index position
      if (i === index) {
        newTransfer[parameter] = value
      }

      return newTransfer
    })

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
    props.handleSubmit(
      title,
      descriptionIpfsPath,
      tokenContract,
      tokenId,
      newTransfers
    )
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className={styles.form_input}>
        <GeneralProposalInputs
          title={title}
          setTitle={setTitle}
          descriptionIpfsPath={descriptionIpfsPath}
          setDescriptionIpfsPath={setDescriptionIpfsPath}
        />
        <br />
        <label>
          Token contract address:{' '}
          <input
            type="text"
            placeholder="KT..."
            list="tokenContracts"
            spellCheck="false"
            minLength="36"
            maxLength="36"
            className={styles.contract_address_input}
            value={tokenContract}
            onMouseDown={() => setTokenContract('')}
            onChange={(e) => setTokenContract(e.target.value)}
          />
          <datalist id="tokenContracts">
            <option value=""></option>
            {TOKENS.map((token) => (
              <option key={token.fa2} value={token.fa2}>
                {token.name}
              </option>
            ))}
          </datalist>
        </label>
        <br />
        <label>
          Token Id:{' '}
          <input
            type="number"
            placeholder="0"
            min="0"
            step="1"
            value={tokenId}
            onChange={(e) => setTokenId(e.target.value)}
          />
        </label>
        <br />
        <div className={styles.transfers_input}>
          {transfers.map((transfer, index) => (
            <div key={index} className={styles.transfer_input}>
              <label>
                Token editions:{' '}
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={transfer.amount}
                  onChange={(e) =>
                    handleChange(index, 'amount', e.target.value)
                  }
                />
              </label>
              <br />
              <label>
                Destination address:{' '}
                <input
                  type="text"
                  placeholder="tz1..."
                  spellCheck="false"
                  minLength="36"
                  maxLength="36"
                  className={styles.tezos_wallet_input}
                  value={transfer.destination}
                  onChange={(e) =>
                    handleChange(index, 'destination', e.target.value)
                  }
                />
              </label>
            </div>
          ))}
        </div>
        <Button shadow_box inline onClick={(e) => handleClick(e, true)}>
          +
        </Button>
        <Button shadow_box inline onClick={(e) => handleClick(e, false)}>
          -
        </Button>
      </div>
      <Button shadow_box>send proposal</Button>
    </form>
  )
}

function LambdaFunctionProposalForm(props) {
  // Set the component state
  const [title, setTitle] = useState('')
  const [descriptionIpfsPath, setDescriptionIpfsPath] = useState(undefined)
  const [michelineCode, setMichelineCode] = useState('')

  // Define the on submit handler
  const handleSubmit = (e) => {
    e.preventDefault()
    props.handleSubmit(title, descriptionIpfsPath, michelineCode)
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className={styles.form_input}>
        <GeneralProposalInputs
          title={title}
          setTitle={setTitle}
          descriptionIpfsPath={descriptionIpfsPath}
          setDescriptionIpfsPath={setDescriptionIpfsPath}
        />
        <br />
        <label className={styles.form_input}>
          Lambda function code in Micheline format:{' '}
          <textarea
            className={styles.micheline_code}
            spellCheck="false"
            value={michelineCode}
            onChange={(e) => setMichelineCode(e.target.value)}
          />
        </label>
      </div>
      <Button shadow_box>send proposal</Button>
    </form>
  )
}
