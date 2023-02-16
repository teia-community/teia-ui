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
          useModalStore.setState({
            visible: true,
            message: 'Checking network for collab contract',
            progress: true,
            confirm: false,
          })

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
                useModalStore.setState({
                  visible: true,
                  message: 'Collaborative contract created successfully',
                  progress: true,
                  confirm: false,
                })

                setTimeout(() => {
                  useModalStore.setState({
                    visible: false,
                  })
                }, 2000)
              } else {
                console.log('missing data')

                // We have got our contract address
                useModalStore.setState({
                  message:
                    'Sorry, there was possibly an error creating the collaborative contract - please check tzkt.io for your wallet address',
                  progress: true,
                  confirm: true,
                })
              }

              // Hide after 2 seconds
              setTimeout(() => {
                useModalStore.setState({
                  visible: false,
                })
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
          console.log('originateProxy', participantData)

          // Clear any existing calls
          set({
            originationOpHash: undefined,
            originatedProxy: undefined,
          })

          // Show progress during creation
          useModalStore.setState({
            visible: true,
            message: 'creating collaborative contract',
            progress: true,
            confirm: false,
          })

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
              useModalStore.setState({
                message: e.message || 'an error occurred',
                progress: false,
                confirm: true,
                confirmCallback: () => {
                  useModalStore.setState({
                    visible: false,
                  })
                },
              })
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
