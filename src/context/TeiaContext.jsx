import { createContext, Component } from 'react'
// import { createContext, useContextSelector } from 'use-context-selector'
import { BeaconWallet } from '@taquito/beacon-wallet'
import { TezosToolkit, OpKind, MichelCodecPacker } from '@taquito/taquito'
import { MichelsonMap } from '@taquito/taquito'
import { packData } from '@utils/swap'
import {
  createProxySchema,
  teiaSwapSchema,
  teiaCancelSwapSchema,
} from '@constants'
import teiaSwapLambda from '@components/collab/lambdas/teiaMarketplaceSwap.json'
import teiaCancelSwapLambda from '@components/collab/lambdas/teiaMarketplaceCancelSwap.json'
import { fetchJSON } from '@utils'

import {
  BURN_ADDRESS,
  HEN_CONTRACT_FA2,
  MAIN_MARKETPLACE_CONTRACT_SWAP_TYPE,
  MAIN_MARKETPLACE_CONTRACT,
  MARKETPLACE_CONTRACT_TEIA,
  MARKETPLACE_CONTRACT_V1,
  PROXY_FACTORY_CONTRACT,
  SIGNING_CONTRACT,
  SUBJKT_CONTRACT,
  SWAP_TYPE_HEN,
  SWAP_TYPE_TEIA,
  UNREGISTRY_CONTRACT,
} from '@constants'
import ls from 'local-storage'
import axios from 'axios'
import verify from '@utils/verify'
import { getUser } from '@data/api'

export const TeiaContext = createContext()

const Tezos = new TezosToolkit(import.meta.env.VITE_TEZOS_RPC)
const Packer = new MichelCodecPacker()

const wallet = new BeaconWallet({
  name: 'teia.art',
  preferredNetwork: 'mainnet',
})

Tezos.setWalletProvider(wallet)

function createAddOperatorCall(
  objktsContract,
  objkt_id,
  ownerAddress,
  operatorAddress
) {
  return {
    kind: OpKind.TRANSACTION,
    ...objktsContract.methods
      .update_operators([
        {
          add_operator: {
            operator: operatorAddress,
            token_id: parseFloat(objkt_id),
            owner: ownerAddress,
          },
        },
      ])
      .toTransferParams({ amount: 0, mutez: true, storageLimit: 175 }),
  }
}

function createRemoveOperatorCall(
  objktsContract,
  objkt_id,
  ownerAddress,
  operatorAddress
) {
  return {
    kind: OpKind.TRANSACTION,
    ...objktsContract.methods
      .update_operators([
        {
          remove_operator: {
            operator: operatorAddress,
            token_id: parseFloat(objkt_id),
            owner: ownerAddress,
          },
        },
      ])
      .toTransferParams({ amount: 0, mutez: true, storageLimit: 175 }),
  }
}

function createSwapCall(
  marketplaceContract,
  objktsAddress,
  objkt_id,
  ownerAddress,
  objkt_amount,
  xtz_per_objkt,
  royalties,
  creator,
  type = MAIN_MARKETPLACE_CONTRACT_SWAP_TYPE
) {
  if (type === SWAP_TYPE_TEIA) {
    return {
      kind: OpKind.TRANSACTION,
      ...marketplaceContract.methods
        .swap(
          objktsAddress,
          parseFloat(objkt_id),
          parseFloat(objkt_amount),
          parseFloat(xtz_per_objkt),
          parseFloat(royalties),
          creator
        )
        .toTransferParams({ amount: 0, mutez: true, storageLimit: 300 }),
    }
  }

  if (type === SWAP_TYPE_HEN) {
    return {
      kind: OpKind.TRANSACTION,
      ...marketplaceContract.methods
        .swap(
          creator,
          parseFloat(objkt_amount),
          parseFloat(objkt_id),
          parseFloat(royalties),
          parseFloat(xtz_per_objkt)
        )
        .toTransferParams({ amount: 0, mutez: true, storageLimit: 300 }),
    }
  }
}

async function createLambdaSwapCall(
  collabContract,
  marketplaceAddress,
  objktsAddress,
  objkt_id,
  ownerAddress,
  objkt_amount,
  xtz_per_objkt,
  royalties,
  creator
) {
  const data = {
    marketplaceAddress,
    params: {
      fa2: objktsAddress,
      objkt_id: parseFloat(objkt_id),
      objkt_amount: parseFloat(objkt_amount),
      royalties: parseFloat(royalties),
      xtz_per_objkt: parseFloat(xtz_per_objkt),
      creator,
    },
  }

  const preparedSwap = packData(data, teiaSwapSchema)
  const { packed } = await Packer.packData(preparedSwap)

  return {
    kind: OpKind.TRANSACTION,
    ...collabContract.methods
      .execute(teiaSwapLambda, packed)
      .toTransferParams({ amount: 0, mutez: true, storageLimit: 300 }),
  }
}

function createSwapCalls(
  objktsContract,
  marketplaceContract,
  objktsAddress,
  operatorAddress,
  objkt_id,
  ownerAddress,
  objkt_amount,
  xtz_per_objkt,
  royalties,
  creator,
  type = MAIN_MARKETPLACE_CONTRACT_SWAP_TYPE
) {
  return [
    createAddOperatorCall(
      objktsContract,
      objkt_id,
      ownerAddress,
      operatorAddress
    ),
    createSwapCall(
      marketplaceContract,
      objktsAddress,
      objkt_id,
      ownerAddress,
      objkt_amount,
      xtz_per_objkt,
      royalties,
      creator,
      type
    ),
    createRemoveOperatorCall(
      objktsContract,
      objkt_id,
      ownerAddress,
      operatorAddress
    ),
  ]
}

class TeiaContextProviderClass extends Component {
  constructor(props) {
    super(props)

    this.state = {
      openedDropdown: {},
      openDropdown: (name) => {
        const dp = { [name]: true }
        this.setState({
          openedDropdown: { ...this.state.openedDropdown, ...dp },
        })
      },
      closeDropdown: (name) => {
        const dp = { [name]: false }
        this.setState({
          openedDropdown: { ...this.state.openedDropdown, ...dp },
        })
      },
      profileFeed: false,
      setProfileFeed: (pf) => {
        this.setState({ profileFeed: pf })
      },

      subjktInfo: {},
      setSubjktInfo: (subjkt) => this.setState({ subjktInfo: subjkt }),

      swap: async (
        from,
        royalties,
        xtz_per_objkt,
        objkt_id,
        creator,
        objkt_amount
      ) => {
        if (this.state.proxyAddress) {
          /* collab contract swap case */
          const proxyContract = await Tezos.wallet.at(this.state.proxyAddress)

          const collabSwapCall = await createLambdaSwapCall(
            proxyContract,
            MAIN_MARKETPLACE_CONTRACT,
            HEN_CONTRACT_FA2,
            objkt_id,
            this.state.proxyAddress,
            objkt_amount,
            xtz_per_objkt,
            royalties,
            creator
          )

          const operations = [
            createAddOperatorCall(
              proxyContract,
              objkt_id,
              this.state.proxyAddress,
              MAIN_MARKETPLACE_CONTRACT
            ),
            collabSwapCall,
            createRemoveOperatorCall(
              proxyContract,
              objkt_id,
              this.state.proxyAddress,
              MAIN_MARKETPLACE_CONTRACT
            ),
          ]

          const batch = await Tezos.wallet.batch(operations)
          return await batch.send()
        }
        const objktsAddress = HEN_CONTRACT_FA2
        const [objktsContract, marketplaceContract] = await Promise.all([
          Tezos.wallet.at(objktsAddress),
          Tezos.wallet.at(MAIN_MARKETPLACE_CONTRACT),
        ])

        const operations = createSwapCalls(
          objktsContract,
          marketplaceContract,
          objktsAddress,
          MAIN_MARKETPLACE_CONTRACT,
          objkt_id,
          from,
          objkt_amount,
          xtz_per_objkt,
          royalties,
          creator,
          MAIN_MARKETPLACE_CONTRACT_SWAP_TYPE
        )

        const batch = await Tezos.wallet.batch(operations)
        return await batch.send()
      },

      reswap: async (price, swap) => {
        // TODO: this function currently does not take collab contracts to account
        const objkt_id = swap.token.id
        const creator = swap.token.creator_id
        const from = swap.creator_id

        if (this.state.proxyAddress) {
          this.state.setFeedback({
            message: 'reswapping is not yet supported in collab mode',
            progress: false,
            visible: true,
            confirm: true,
            confirmCallback: () => {
              this.state.setFeedback({
                visible: false,
              })
            },
          })
          return
        }

        const [objktsContract, marketplaceContract, mainMarketplaceContract] =
          await Promise.all([
            Tezos.wallet.at(HEN_CONTRACT_FA2),
            Tezos.wallet.at(swap.contract_address), // this can be either v1, v2 or teia
            Tezos.wallet.at(MAIN_MARKETPLACE_CONTRACT),
          ])

        const list = [
          // cancel current swap
          {
            kind: OpKind.TRANSACTION,
            ...marketplaceContract.methods
              .cancel_swap(parseFloat(swap.id))
              .toTransferParams({ amount: 0, mutez: true, storageLimit: 310 }),
          },
          // swap with new price
          ...createSwapCalls(
            objktsContract,
            mainMarketplaceContract,
            HEN_CONTRACT_FA2,
            MAIN_MARKETPLACE_CONTRACT,
            objkt_id,
            from,
            swap.amount_left,
            price,
            swap.royalties,
            creator,
            MAIN_MARKETPLACE_CONTRACT_SWAP_TYPE
          ),
        ]

        console.debug(list)
        const batch = await Tezos.wallet.batch(list)
        return await batch.send()
      },

      // --------------------
      // feedback component
      // --------------------

      // TODO (xat): use some kind of modal/proxy for the feedback stuff
      feedback: {
        visible: false, // show or hide the component
        message: 'OBJKT minted', // what message to display?
        progress: true, // do we need to display a progress indicator?
        confirm: true, // do we display a confirm button?
        confirmCallback: () => null, // any function to run when the user clicks confirm
      },

      setFeedback: (props) =>
        this.setState({ feedback: { ...this.state.feedback, ...props } }),

      showFeedback: (message) => {
        this.state.setFeedback({
          message,
          progress: false,
          visible: true,
          confirm: true,
          confirmCallback: () => {
            this.state.setFeedback({
              visible: false,
            })
          },
        })
      },
      progress: undefined,
      setProgress: (bool) => this.setState({ progress: bool }),
      message: undefined,
      setMessage: (str) => this.setState({ message: str }),
      // --------------------
      // feedback component end
      // --------------------
      pathname: '',

      address: '',

      op: undefined,

      contract: '',

      setAddress: (address) => this.setState({ address }),

      client: null,

      // Signed in collab address (if applicable)
      // We will retrieve from local storage
      proxyAddress: ls.get('collab_address'),
      proxyName: ls.get('collab_name'),

      // This will be set after creating a new collab
      // but we don't want to auto-sign in
      originatedContract: undefined,
      originationOpHash: undefined,

      setProxyAddress: (proxyAddress, proxyName) => {
        // setting proxy updates objkt contract as well:
        this.setState({
          proxyAddress,
          proxyName,
        })

        // Store in local storage too for retrieval later
        ls.set('collab_address', proxyAddress)
        ls.set('collab_name', proxyName)
      },

      mint: async (tz, amount, cid, royalties) => {
        // show feedback component with followind message and progress indicator

        console.debug('CID', cid)

        this.state.setFeedback({
          visible: true,
          message: 'minting OBJKT',
          progress: true,
          confirm: false,
        })

        const handleOpStatus = async (op) => {
          try {
            const status = await op.status()
            console.debug('op', status)
            if (status === 'applied') {
              this.state.showFeedback('OBJKT minted successfully')
              return { handled: true, error: false }
            } else if (status === 'backtracked') {
              this.state.showFeedback(
                'the transaction was backtracked. try minting again'
              )
              return { handled: true, error: true }
            }
          } catch (error) {
            console.error(error)
          }
          return { handled: false, error: false }
        }

        const DEFAULT_ERROR_MESSAGE = 'an error occurred ❌'

        // call mint method
        return await Tezos.wallet
          .at(this.state.proxyAddress || MARKETPLACE_CONTRACT_V1)
          .then((c) =>
            c.methods
              .mint_OBJKT(
                tz,
                parseFloat(amount),
                `ipfs://${cid}`
                  .split('')
                  .reduce(
                    (hex, c) =>
                      (hex += c.charCodeAt(0).toString(16).padStart(2, '0')),
                    ''
                  ),
                parseFloat(royalties) * 10
              )
              .send({ amount: 0, storageLimit: 310 })
          )
          .then((op) => {
            this.state.setFeedback({
              visible: true,
              message: 'confirming transaction',
              progress: true,
              confirm: false,
            })
            return op
              .confirmation(1)
              .then(async () => {
                const { handled, error } = await handleOpStatus(op)
                if (!handled) {
                  this.state.showFeedback(DEFAULT_ERROR_MESSAGE)
                }
                return !error
              })
              .catch(async (err) => {
                console.error(err)
                const { handled, error } = await handleOpStatus(op)
                if (!handled) {
                  const message =
                    error.message === 'Confirmation polling timed out'
                      ? 'a timeout occurred, but the mint might have succeeded'
                      : DEFAULT_ERROR_MESSAGE
                  this.state.showFeedback(message)
                  return !error
                }
                return false
              })
          })
          .catch((error) => {
            console.error(error)
            this.state.showFeedback(DEFAULT_ERROR_MESSAGE)
            return false
          })
      },

      collect: async (listing) => {
        if (['HEN_SWAP_V2', 'TEIA_SWAP'].includes(listing.type)) {
          return await Tezos.wallet
            .at(listing.contract_address)
            .then((c) =>
              c.methods.collect(parseInt(listing.swap_id)).send({
                amount: parseInt(listing.price),
                mutez: true,
                storageLimit: 350,
              })
            )
            .catch((e) => e)
        } else if (['OBJKT_ASK', 'OBJKT_ASK_V2'].includes(listing.type)) {
          return await Tezos.wallet.at(listing.contract_address).then((c) =>
            c.methods.fulfill_ask(listing.ask_id).send({
              amount: listing.price,
              mutez: true,
              storageLimit: 350,
            })
          )
        } else if (['VERSUM_SWAP'].includes(listing.type)) {
          return await Tezos.wallet.at(listing.contract_address).then((c) =>
            c.methods.collect_swap('1', listing.swap_id).send({
              amount: listing.price,
              mutez: true,
              storageLimit: 350,
            })
          )
        } else {
          throw new Error('unsupported listing')
        }
      },

      sign: async (objkt_id) => {
        await Tezos.wallet
          .at(SIGNING_CONTRACT)
          .then((c) =>
            c.methods.sign(objkt_id).send({ amount: 0, storageLimit: 310 })
          )
          .then((op) => console.log(op))
      },

      transfer: async (txs) => {
        const { proxyAddress, objkts, address } = this.state

        const contract = proxyAddress || objkts

        await Tezos.wallet.at(contract).then(async (c) =>
          c.methods
            .transfer([
              {
                from_: proxyAddress || address,
                txs,
              },
            ])
            .send()
        )

        this.state.setFeedback({
          progress: false,
          visible: false,
        })
      },

      burn: async (objkt_id, amount) => {
        const tz = await wallet.client.getActiveAccount()
        const objktsOrProxy = this.state.proxyAddress || HEN_CONTRACT_FA2
        const addressFrom = this.state.proxyAddress || tz.address

        console.log('Using', objktsOrProxy, 'for burn')

        await Tezos.wallet.at(objktsOrProxy).then(async (c) =>
          c.methods
            .transfer([
              {
                from_: addressFrom,
                txs: [
                  {
                    to_: BURN_ADDRESS,
                    token_id: parseInt(objkt_id),
                    amount: parseInt(amount),
                  },
                ],
              },
            ])
            .send()
        )

        this.state.setProgress(false)
      },

      cancelv1: async (swap_id) => {
        return await Tezos.wallet
          .at(MARKETPLACE_CONTRACT_V1)
          .then((c) =>
            c.methods
              .cancel_swap(parseFloat(swap_id))
              .send({ amount: 0, storageLimit: 310 })
          )
          .catch((e) => e)
      },

      cancel: async (contract_address, swap_id) => {
        const isSwapTeia = contract_address === MARKETPLACE_CONTRACT_TEIA
        if (this.state.proxyAddress && isSwapTeia) {
          /* collab contract cancel swap for Teia Marketplace case */
          const data = {
            marketplaceAddress: contract_address,
            swap_id: parseFloat(swap_id),
          }
          const preparedCancel = packData(data, teiaCancelSwapSchema)
          const { packed } = await Packer.packData(preparedCancel)
          return await Tezos.wallet
            .at(this.state.proxyAddress)
            .then((c) =>
              c.methods
                .execute(teiaCancelSwapLambda, packed)
                .send({ amount: 0, storageLimit: 310 })
            )
            .catch((e) => e)
        }

        /* Marketplace without collab case OR collab on V1/V2 marketplace */
        return await Tezos.wallet
          .at(this.state.proxyAddress || contract_address)
          .then((c) =>
            c.methods
              .cancel_swap(parseFloat(swap_id))
              .send({ amount: 0, storageLimit: 310 })
          )
          .catch((e) => e)
      },

      signStr: async (payload) => {
        const signedPayload = await wallet.client.requestSignPayload(payload)
        // console.log(signature.signature, payload.payload, await wallet.getPKH())
        /*         const r = await KeyStoreUtils.checkSignature(
          signature.signature,
          payload.payload,
          await axios.get(`https://tezos-prod.cryptonomic-infra.tech/chains/main/blocks/head/context/contracts/${await wallet.getPKH()}/manager_key`).then(res => res.data)
        ) */

        await verify(
          payload.payload.toString(),
          signedPayload.signature,
          await axios.get(
            `https://tezos-prod.cryptonomic-infra.tech/chains/main/blocks/head/context/contracts/${await wallet.getPKH()}/manager_key`
          )
        )
        // console.log(r)
      },

      /**
       * Call the SUBJKT Contract Registry
       * @param {str} alias
       * @param {str} metadataCID
       * @returns {any}
       * */
      registry: async (alias, metadata) => {
        const subjktAddressOrProxy = this.state.proxyAddress || SUBJKT_CONTRACT

        return await Tezos.wallet.at(subjktAddressOrProxy).then((c) =>
          c.methods
            .registry(
              `ipfs://${metadata}`
                .split('')
                .reduce(
                  (hex, c) =>
                    (hex += c.charCodeAt(0).toString(16).padStart(2, '0')),
                  ''
                ),
              alias
                .split('')
                .reduce(
                  (hex, c) =>
                    (hex += c.charCodeAt(0).toString(16).padStart(2, '0')),
                  ''
                )
            )
            .send({ amount: 0 })
        )
      },

      unregister: async () => {
        return await Tezos.wallet.at(UNREGISTRY_CONTRACT).then((c) => {
          c.methods.sign(undefined).send({ amount: 0 })
        })
      },

      load: false,
      loading: () => this.setState({ load: !this.state.load }),
      /* taquito */
      Tezos: null,
      wallet: null,
      userInfo: null,

      updateMessage: (message) => this.setState({ message }),

      setAccount: async () => {
        const current =
          Tezos !== undefined
            ? await wallet.client.getActiveAccount()
            : undefined
        this.setState({
          userInfo:
            current?.address &&
            (await getUser(current.address, 'user_address')),
          address: current?.address,
        })
      },

      syncTaquito: async () => {
        const network = {
          type: 'mainnet',
          rpcUrl: import.meta.env.VITE_TEZOS_RPC,
        }

        // We check the storage and only do a permission request if we don't have an active account yet
        // This piece of code should be called on startup to "load" the current address from the user
        // If the activeAccount is present, no "permission request" is required again, unless the user "disconnects" first.
        let activeAccount = await wallet.client.getActiveAccount()

        if (activeAccount === undefined) {
          console.log('permissions')
          await wallet.requestPermissions({ network })
          activeAccount = await wallet.client.getActiveAccount()
        }
        const current = await wallet.getPKH()
        this.setState({
          Tezos,
          address: current,
          userInfo: current && (await getUser(current)),
          wallet,
        })
        // console.log(this.state)
        return activeAccount.address
      },

      disconnect: async () => {
        // console.log('disconnect wallet')
        // This will clear the active account and the next "syncTaquito" will trigger a new sync
        await wallet.client.clearActiveAccount()
        this.setState({
          address: undefined,
          userInfo: undefined,
          acc: undefined,
        })
      },

      /*
      /*
            airgap/thanos interop methods
      */
      operationRequest: async (obj) => {
        const op = obj.result
        delete op.mutez
        op.destination = op.to
        op.kind = 'transaction'
        delete op.to
        // console.log(obj.result)

        this.state.client.requestOperation({
          operationDetails: [obj.result],
        })
      },

      timeout: (delay) => {
        return new Promise((res) => setTimeout(res, delay))
      },

      signPayload: async (obj) => {
        await wallet.client
          .requestSignPayload({
            payload: obj.payload,
          })
          .then(async (response) => {
            return response.signature
          })
          .catch((signPayloadError) => console.error(signPayloadError))
      },

      balance: 0,
      /**
       *
       * @param {str} address The tezos address to check the balance of
       * @returns {float} The balance of the address in mutez
       */
      getBalance: async (address) => {
        const res = await fetchJSON(
          `https://api.tzkt.io/v1/accounts/${address}`
        )
        if (res?.balance) {
          return parseFloat(res.balance) / 1e6
        }
      },

      feed: [],

      offset: 0,

      setFeed: (arr) => this.setState({ feed: arr }),

      /** Main menu is collapsed */
      collapsed: true,

      toggleMenu: () => {
        document.body.style.overflowY = this.state.collapsed ? 'scroll' : null
        document.body.style.position = this.state.collapsed ? 'fixed' : null
        this.setState({ collapsed: !this.state.collapsed })
      },

      collapseMenu: (collapsed) => {
        this.setState({ collapsed })
        document.body.style.overflowY = collapsed ? null : 'scroll'
        document.body.style.position = collapsed ? null : 'fixed'
      },

      getStyle: (style) =>
        style ? { background: 'white' } : { display: 'none' },

      lastPath: '',

      setPath: (path) => {
        this.setState({
          lastPath: path,
        })
      },
      title: '',
      setTitle: (title) => {
        this.setState({
          title,
        })
      },

      mockProxy: async () => {
        this.state.setFeedback({
          visible: true,
          message: 'creating collaborative contract',
          progress: true,
          confirm: false,
        })

        setTimeout(() => {
          const result = {
            opHash: 'oo28JbSrWr7NMy95qdba56m85TcA2poJCgteB5DWUEMrZvC1B38', // current one
          }

          this.setState({
            originationOpHash: result.opHash,
          })

          this.state.setFeedback({
            visible: false,
          })
        }, 2000)
      },

      findOriginatedContractFromOpHash: async (hash) => {
        this.state.setFeedback({
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

              this.setState({
                originatedContract,
                originationOpHash: undefined,
              }) // save hash

              console.log('Saved state originatedContract', originatedContract)

              // We have got our contract address
              this.state.setFeedback({
                visible: true,
                message: 'Collaborative contract created successfully',
                progress: true,
                confirm: false,
              })

              setTimeout(() => {
                this.state.setFeedback({
                  visible: false,
                })
              }, 2000)
            } else {
              console.log('missing data')

              // We have got our contract address
              this.state.setFeedback({
                message:
                  'Sorry, there was possibly an error creating the collaborative contract - please check tzkt.io for your wallet address',
                progress: true,
                confirm: true,
              })
            }

            // Hide after 2 seconds
            setTimeout(() => {
              this.state.setFeedback({
                visible: false,
              })
            }, 2000)
          })
      },

      originateProxy: async (participantData) => {
        console.log('originateProxy', participantData)

        // Clear any existing calls
        this.setState({
          originationOpHash: undefined,
          originatedProxy: undefined,
        })

        // Show progress during creation
        this.state.setFeedback({
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
            this.setState({
              originationOpHash: result.opHash,
            })
          })
          .catch((e) => {
            this.state.setFeedback({
              message: e.message || 'an error occurred',
              progress: false,
              confirm: true,
              confirmCallback: () => {
                this.state.setFeedback({
                  visible: false,
                })
              },
            })
          })
      },
    }
  }

  render() {
    return (
      <TeiaContext.Provider
        value={{
          ...this.state,
        }}
      >
        {this.props.children}
      </TeiaContext.Provider>
    )
  }
}

export default TeiaContextProviderClass
