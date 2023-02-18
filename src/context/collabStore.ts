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
import { Tezos } from './userStore'
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

          step('Checking network for collab contract')

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
                step('Collaborative contract created successfully')

                setTimeout(() => {
                  closeModal()
                }, 2000)
              } else {
                console.log('missing data')

                // We have got our contract address
                showModal(
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
          await Tezos.wallet
            .at(SIGNING_CONTRACT)
            .then((c) =>
              c.methods.sign(objkt_id).send({ amount: 0, storageLimit: 310 })
            )
            .then((op) => console.log(op))
        },
        originateProxy: async (participantData: any) => {
          const step = useModalStore.getState().step
          const showModal = useModalStore.getState().show

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
          await Tezos.wallet
            .at(PROXY_FACTORY_CONTRACT)
            .then((c) =>
              c.methods.create_proxy(packed, 'hic_proxy').send({ amount: 0 })
            )
            .then((result) => {
              console.log('Result of originate call', result)

              // Set the operation hash to trigger the countdown that checks for the originated contract
              set({
                originationOpHash: result.opHash,
              })
            })
            .catch((e) => {
              showModal('Originate (Error)', e.message || 'an error occurred')
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
