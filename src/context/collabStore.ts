import axios from 'axios'
import {
  createProxySchema,
  PROXY_FACTORY_CONTRACT,
  SIGNING_CONTRACT,
} from '@constants'
import { create } from 'zustand'
import {
  createJSONStorage,
  persist,
  subscribeWithSelector,
} from 'zustand/middleware'

import { useModalStore } from './modalStore'
import { Tezos, useUserStore } from './userStore'
import { MichelsonMap } from '@taquito/michelson-encoder'
import { packData, Packer } from '@utils/swap'
interface CollabState {
  originatedContract?: string
  originationOpHash?: string
  originatedProxy?: string
  findOriginatedContractFromOpHash: (hash: string) => void
  sign: (objktID: string) => void
}

export const useCollabStore = create<CollabState>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        originatedContract: undefined,
        findOriginatedContractFromOpHash: async (hash) => {
          const step = useModalStore.getState().step
          const closeModal = useModalStore.getState().close
          const showModal = useModalStore.getState().show

          step('Originating Contract', 'Checking network for collab contract')

          axios
            .get(`https://api.tzkt.io/v1/operations/originations/${hash}`)
            .then((response) => {
              const { data } = response

              console.log('response from originations call', data[0])

              if (data[0]) {
                console.log('There is correct data', data[0])

                // Send the originated contract to the UI via context
                const { originatedContract } = data[0]

                set({
                  originatedContract,
                  originationOpHash: undefined,
                }) // save hash

                console.log(
                  'Saved state originatedContract',
                  originatedContract
                )

                // We have got our contract address
                step(
                  'Originating Contract',
                  'Collaborative contract created successfully'
                )

                setTimeout(() => {
                  closeModal()
                }, 2500)
              } else {
                console.log('missing data')

                // We have got our contract address
                showModal(
                  'Originating Contract (Error)',
                  'Sorry, there was possibly an error creating the collaborative contract - please check tzkt.io for your wallet address'
                )
              }

              // Hide after 2 seconds
              setTimeout(() => {
                closeModal()
              }, 2000)
            })
        },

        sign: async (objkt_id) => {
          const handleOp = useUserStore.getState().handleOp
          const step = useModalStore.getState().step
          step('Signing OBJKT', 'Waiting for wallet', true)
          const contract = await Tezos.wallet.at(SIGNING_CONTRACT)

          const op = contract.methods.sign(objkt_id)

          return await handleOp(op, 'Signing OBJKT', {
            amount: 0,
            storageLimit: 310,
          })
        },
        originateProxy: async (participantData: any) => {
          const step = useModalStore.getState().step
          const handleOp = useUserStore.getState().handleOp

          console.log('originateProxy', participantData)

          // Clear any existing calls
          set({
            originationOpHash: undefined,
            originatedProxy: undefined,
          })

          // Show progress during creation
          step('Originate', 'creating collaborative contract')

          const participantMap = MichelsonMap.fromLiteral(participantData)
          const packDataParams = packData(participantMap, createProxySchema)

          // Pack hex data for origination call
          const { packed } = await Packer.packData(packDataParams)

          // Blockchain ops
          const contract = await Tezos.wallet.at(PROXY_FACTORY_CONTRACT)
          const op = contract.methods.create_proxy(packed, 'hic_proxy')

          const opHash = await handleOp(op, 'Originate', { amount: 0 })
          set({
            originationOpHash: opHash,
          })
        },
      }),
      {
        name: 'collab',
        storage: createJSONStorage(() => localStorage), // or sessionStorage?
      }
    )
  )
)
