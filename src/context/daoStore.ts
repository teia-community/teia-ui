import { create } from 'zustand'
import {
  persist,
  createJSONStorage,
  subscribeWithSelector,
} from 'zustand/middleware'
import { Parser } from '@taquito/michel-codec'
import { validateAddress } from '@taquito/utils'
import {
  DAO_GOVERNANCE_CONTRACT,
  DAO_TOKEN_CONTRACT,
  DAO_TOKEN_DECIMALS,
  DAO_TOKEN_CLAIM_CONTRACT,
  DISTRIBUTION_MAPPING_IPFS_PATH,
  MERKLE_DATA_IPFS_PATHS,
} from '@constants'
import { Tezos, useUserStore } from './userStore'
import { useModalStore } from './modalStore'
import { getClaimedDaoTokens } from '@data/api'
import { downloadJsonFileFromIpfs, uploadFileToIPFSProxy } from '@utils/ipfs'
import { stringToHex } from '@utils/string'

type OperationReturn = Promise<string | undefined>

interface DaoState {
  /** Uploads a file to ipfs */
  uploadFileToIpfs: (file: any, displayUploadInformation: boolean) => OperationReturn
  /** Votes a DAO proposal using the user TEIA tokens */
  voteProposal: (proposalId: string, vote: string, maxCheckpoints: number | null, callback: any) => OperationReturn
  /** Votes a DAO proposal as community representaive */
  voteProposalAsRepresentative: (proposalId: string, vote: string, callback: any) => OperationReturn
  /** Cancels a DAO proposal */
  cancelProposal: (proposalId: string, returnEscrow: boolean, callback: any) => OperationReturn
  /** Evaluates a DAO proposal voting result */
  evaluateVotingResult: (proposalId: string, callback: any) => OperationReturn
  /** Executes a DAO proposal */
  executeProposal: (proposalId: string, callback: any) => OperationReturn
  /** Creates a DAO proposal */
  createProposal: (title: string, descriptionIpfsPath: string, kind: any, callback: any) => OperationReturn
  /** Creates a DAO text proposal */
  createTextProposal: (title: string, descriptionIpfsPath: string, callback: any) => OperationReturn
  /** Creates a DAO transfer mutez proposal */
  createTransferMutezProposal: (title: string, descriptionIpfsPath: string, transfers: any, callback: any) => OperationReturn
  /** Creates a DAO transfer token proposal */
  createTransferTokenProposal: (title: string, descriptionIpfsPath: string, tokenAddress: string, tokenId: string, transfers: any, callback: any) => OperationReturn
  /** Creates a DAO lambda function proposal */
  createLambdaFunctionProposal: (title: string, descriptionIpfsPath: string, michelineCode: string, callback: any) => OperationReturn
  /** Claim DAO tokens */
  claimTokens: () => OperationReturn
}

export const useDaoStore = create<DaoState>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        uploadFileToIpfs: async (file, displayUploadInformation) => {
          const show = useModalStore.getState().show
          const step = useModalStore.getState().step
          const close = useModalStore.getState().close

          const modalTitle = 'IPFS upload'

          if (!file) {
            show(
              modalTitle,
              'A file needs to be loaded before uploading to IPFS'
            )
            return
          }

          if (displayUploadInformation) {
            step(modalTitle, `Uploading ${file.name} to IPFS...`)
          }

          const added = await uploadFileToIPFSProxy(file)

          if (displayUploadInformation) {
            close()
          }

          console.log(`File IPFS cid: ${added?.data.cid}`)

          return added?.data.cid
        },
        voteProposal: async (proposalId, vote, maxCheckpoints, callback) => {
          const handleOp = useUserStore.getState().handleOp
          const showError = useModalStore.getState().showError
          const step = useModalStore.getState().step

          const modalTitle = 'Vote DAO proposal'
          step(modalTitle, 'Waiting for confirmation', true)

          try {
            const contract = await Tezos.wallet.at(DAO_GOVERNANCE_CONTRACT)

            const parameters = {
              proposal_id: proposalId,
              vote: { [vote]: [['unit']] },
              max_checkpoints: maxCheckpoints
            }
            const batch = contract.methodsObject.token_vote(parameters)
            const opHash = await handleOp(batch, modalTitle)

            callback?.()

            return opHash
          } catch (e) {
            showError(modalTitle, e)
          }
        },
        voteProposalAsRepresentative: async (proposalId, vote, callback) => {
          const handleOp = useUserStore.getState().handleOp
          const showError = useModalStore.getState().showError
          const step = useModalStore.getState().step

          const modalTitle = 'Vote DAO proposal as representative'
          step(modalTitle, 'Waiting for confirmation', true)

          try {
            const contract = await Tezos.wallet.at(DAO_GOVERNANCE_CONTRACT)

            const parameters = {
              proposal_id: proposalId,
              vote: { [vote]: [['unit']] }
            }
            const batch = contract.methodsObject.representatives_vote(parameters)
            const opHash = await handleOp(batch, modalTitle)
            
            callback?.()

            return opHash
          } catch (e) {
            showError(modalTitle, e)
          }
        },
        cancelProposal: async (proposalId, returnEscrow, callback) => {
          const handleOp = useUserStore.getState().handleOp
          const showError = useModalStore.getState().showError
          const step = useModalStore.getState().step

          const modalTitle = 'Cancel DAO proposal'
          step(modalTitle, 'Waiting for confirmation', true)

          try {
            const contract = await Tezos.wallet.at(DAO_GOVERNANCE_CONTRACT)

            const batch = contract.methods.cancel_proposal(proposalId, returnEscrow)
            const opHash = await handleOp(batch, modalTitle)
            
            callback?.()

            return opHash
          } catch (e) {
            showError(modalTitle, e)
          }
        },
        evaluateVotingResult: async (proposalId, callback) => {
          const handleOp = useUserStore.getState().handleOp
          const showError = useModalStore.getState().showError
          const step = useModalStore.getState().step

          const modalTitle = 'Evaluate DAO proposal voting result'
          step(modalTitle, 'Waiting for confirmation', true)

          try {
            const contract = await Tezos.wallet.at(DAO_GOVERNANCE_CONTRACT)

            const batch = contract.methods.evaluate_voting_result(proposalId)
            const opHash = await handleOp(batch, modalTitle)
            
            callback?.()

            return opHash
          } catch (e) {
            showError(modalTitle, e)
          }
        },
        executeProposal: async (proposalId, callback) => {
          const handleOp = useUserStore.getState().handleOp
          const showError = useModalStore.getState().showError
          const step = useModalStore.getState().step

          const modalTitle = 'Execute DAO proposal'
          step(modalTitle, 'Waiting for confirmation', true)

          try {
            const contract = await Tezos.wallet.at(DAO_GOVERNANCE_CONTRACT)

            const batch = contract.methods.execute_proposal(proposalId)
            const opHash = await handleOp(batch, modalTitle)
            
            callback?.()

            return opHash
          } catch (e) {
            showError(modalTitle, e)
          }
        },
        createProposal: async (title, descriptionIpfsPath, kind, callback) => {
          const userAddress = useUserStore.getState().address
          const handleOp = useUserStore.getState().handleOp
          const show = useModalStore.getState().show
          const showError = useModalStore.getState().showError
          const step = useModalStore.getState().step

          const modalTitle = 'Submit DAO proposal'

          if (!title || title.length < 10) {
            show(
              modalTitle,
              'The proposal title must be at least 10 charactes long'
            )
            return
          }

          if (!descriptionIpfsPath) {
            show(
              modalTitle,
              'The proposal description needs to be uploaded first to IPFS'
            )
            return
          }

          step(modalTitle, 'Waiting for confirmation', true)

          try {
            const contract = await Tezos.wallet.at(DAO_GOVERNANCE_CONTRACT)
            const tokenContract = await Tezos.wallet.at(DAO_TOKEN_CONTRACT)

            const operator = {
              owner: userAddress,
              operator: DAO_GOVERNANCE_CONTRACT,
              token_id: 0,
            }
            const parameters = {
              title: stringToHex(title),
              description: stringToHex(`ipfs://${descriptionIpfsPath}`),
              kind: kind,
            }
            let batch = Tezos.wallet.batch()
            batch = batch.withContractCall(
              tokenContract.methods.update_operators([{ add_operator: operator }])
            )
            batch = batch.withContractCall(
              contract.methodsObject.create_proposal(parameters)
            )
            batch = batch.withContractCall(
              tokenContract.methods.update_operators([{ remove_operator: operator }])
            )
            const opHash = await handleOp(batch, modalTitle)
            
            callback?.()

            return opHash
          } catch (e) {
            showError(modalTitle, e)
          }
        },
        createTextProposal: async (title, descriptionIpfsPath, callback) => {
          const kind = { text: [['unit']] }
          return get().createProposal(title, descriptionIpfsPath, kind, callback)
        },
        createTransferMutezProposal: async (title, descriptionIpfsPath, transfers, callback) => {
          const show = useModalStore.getState().show

          for (const transfer of transfers) {
            const destination = transfer.destination

            if (!(destination && validateAddress(destination) === 3)) {
              show(
                'Submit DAO proposal',
                `The provided address is not a valid tezos address: ${destination}`
              )
              return
            }

            const kind = { transfer_mutez: transfers }
            return get().createProposal(title, descriptionIpfsPath, kind, callback)
          }
        },
        createTransferTokenProposal: async (title, descriptionIpfsPath, tokenAddress, tokenId, transfers, callback) => {
          const show = useModalStore.getState().show

          if (!(tokenAddress && validateAddress(tokenAddress) === 3)) {
            show(
              'Submit DAO proposal',
              `The provided token contract address is not a valid tezos address: ${tokenAddress}`
            )
            return
          }

          for (const transfer of transfers) {
            const destination = transfer.destination

            if (!(destination && validateAddress(destination) === 3)) {
               show(
                'Submit DAO proposal',
                `The provided address is not a valid tezos address: ${destination}`
              )
              return
            }
          }

          const kind = {
            transfer_token: {
              fa2: tokenAddress,
              token_id: tokenId,
              distribution: transfers,
            }
          }
          return get().createProposal(title, descriptionIpfsPath, kind, callback)
        },
        createLambdaFunctionProposal: async (title, descriptionIpfsPath, michelineCode, callback) => {
          const show = useModalStore.getState().show

          let lambdaFunction

          try {
            const parser = new Parser()
            lambdaFunction = parser.parseMichelineExpression(michelineCode)
          } catch (e) {
            show(
              'Create DAO proposal',
              'The provided lambda function Michelson code is not correct'
            )
            return
          }

          const kind = { lambda_function: lambdaFunction }
          return get().createProposal(title, descriptionIpfsPath, kind, callback)
        },
        claimTokens: async () => {
          const userAddress = useUserStore.getState().address
          const handleOp = useUserStore.getState().handleOp
          const show = useModalStore.getState().show
          const showError = useModalStore.getState().showError
          const step = useModalStore.getState().step

          const modalTitle = 'Claim DAO tokens'
          step(modalTitle, 'Claiming Teia DAO tokens', true)

          if (!userAddress) {
            show(modalTitle, 'You need to sync your wallet first')
            return
          }

          // Download the distribution mapping file from IPFS
          const distributionMapping = await downloadJsonFileFromIpfs(
            DISTRIBUTION_MAPPING_IPFS_PATH
          )

          if (!distributionMapping) {
            show(
              modalTitle,
              'Could not download the distribution map from IPFS'
            )
            return
          } else if (!(userAddress in distributionMapping)) {
            show(
              modalTitle,
              'Your wallet is not in the distribution list.\n' +
                "Sorry, you don't qualify to claim any tokens."
            )
            return
          }

          // Download the file with the user Merkle proofs
          const fileIndex = distributionMapping[userAddress]
          const merkleData = await downloadJsonFileFromIpfs(
            MERKLE_DATA_IPFS_PATHS[fileIndex]
          )

          if (!merkleData) {
            show(
              modalTitle,
              'Could not download the user Merkle proofs from IPFS'
            )
            return
          }

          // Calculate the tokens that the user still can claim
          const userMerkleData = merkleData[userAddress]
          const totalTokensToClaim = parseInt(userMerkleData.tokens) / DAO_TOKEN_DECIMALS
          const alreadyClaimedTokens = (await getClaimedDaoTokens(userAddress)) / DAO_TOKEN_DECIMALS
          const unclaimedTokens = totalTokensToClaim - (alreadyClaimedTokens ? alreadyClaimedTokens : 0)

          if (unclaimedTokens === 0) {
            show(
              modalTitle,
              'Sorry, but you already claimed all your tokens'
            )
            return
          }

          step(
            modalTitle,
            `You are allowed to claim ${unclaimedTokens} DAO tokens`
          )

          // Send the claim operation
          try {
            const contract = await Tezos.wallet.at(DAO_TOKEN_CLAIM_CONTRACT)

            const batch = contract.methods.claim(
              userMerkleData.proof,
              userMerkleData.leafDataPacked
            )

            return await handleOp(batch, modalTitle, {
              amount: 0,
              storageLimit: 400,
            })
          } catch (e) {
            showError(modalTitle, e)
          }
        },
      }),
      {
        name: 'dao',
        storage: createJSONStorage(() => localStorage), // or sessionStorage?
      }
    )
  )
)
