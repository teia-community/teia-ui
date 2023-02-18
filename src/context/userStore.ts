import { BeaconWallet } from '@taquito/beacon-wallet'
import {
  OpKind,
  MichelCodecPacker,
  TezosToolkit,
  TransactionWalletOperation,
} from '@taquito/taquito'
import { create } from 'zustand'
import {
  persist,
  createJSONStorage,
  subscribeWithSelector,
} from 'zustand/middleware'
import { useLocalSettings } from './localSettingsStore'
import { NetworkType } from '@airgap/beacon-types'
import { getUser } from '@data/api'
import axios from 'axios'
import {
  BURN_ADDRESS,
  HEN_CONTRACT_FA2,
  MAIN_MARKETPLACE_CONTRACT,
  MAIN_MARKETPLACE_CONTRACT_SWAP_TYPE,
  MARKETPLACE_CONTRACT_TEIA,
  MARKETPLACE_CONTRACT_V1,
  SUBJKT_CONTRACT,
  teiaCancelSwapSchema,
} from '@constants'
import {
  createAddOperatorCall,
  createLambdaSwapCall,
  createRemoveOperatorCall,
  createSwapCalls,
  packData,
} from '@utils/swap'
import { useModalStore } from './modalStore'
// import teiaSwapLambda from '@components/collab/lambdas/teiaMarketplaceSwap.json'
import teiaCancelSwapLambda from '@components/collab/lambdas/teiaMarketplaceCancelSwap.json'
import { Listing, NFT } from '@types'
import { BatchWalletOperation } from '@taquito/taquito/dist/types/wallet/batch-operation'
import { ParametersInvalidBeaconError } from '@airgap/beacon-core'

interface SubjktMeta {
  identicon?: string
  description?: string
}

interface SubjktInfo {
  userAddress: string
  name?: string
  metadata: SubjktMeta // this is actually nested in data?
}

interface UserState {
  /** The user tezos address */
  address?: string
  /** The current collab address */
  proxyAddress?: string
  /** The resolved name of the current collab  */
  proxyName?: string
  /** TODO: remove this or userinfo  */
  subjktInfo?: SubjktInfo
  /** User base info */
  userInfo?: any
  /** Wallet sync  */
  sync: () => Promise<string | undefined>
  /** Wallet unsync  */
  unsync: () => void
  /** Register SUBJKT  */
  registry: (
    alias: string,
    metadata_cid: string
  ) => Promise<string | TransactionWalletOperation>
  /** Swap token  */
  swap: (
    from: string,
    royalties: number,
    xtz_per_objkt: number,
    objkt_id: string,
    creator: string,
    objkt_amount: number
  ) => Promise<BatchWalletOperation | undefined>
  /** Burn Token */
  burn: (objkt_id: string, amount: number) => void
  /** Reswap Token */
  reswap: (
    nft: NFT,
    price: number,
    swap: Listing
  ) => Promise<BatchWalletOperation | undefined>
  /** Collect token */
  collect: (listing: {
    type: string
    contract_address: string
    swap_id: string
    price: string
    ask_id: any
  }) => void
  /** Cancel Swap */
  cancel: (contract: string, swap_id: number) => void
  /** Cancel Swap from V1 */
  cancelv1: (swapid: string) => void
  /** Retrieve account from localStorage (beacon mechanism) */
  setAccount: () => void
  /** Set the proxy address */
  resetProxy: () => void
  /** Mint the token */
  mint: (
    tz: string,
    amount: number,
    cid: string,
    royalties: number
  ) => Promise<boolean>
}

interface TzkTAccount {
  balance: string
}

interface Tx {
  to_?: string
  amount?: number
  token_id: string
}

export const Tezos = new TezosToolkit(useLocalSettings.getState().rpcNode)
const Packer = new MichelCodecPacker()

const wallet = new BeaconWallet({
  name: 'teia.art',
  appUrl: 'https://teia.art',
  iconUrl: 'https://teia.art/icons/android-chrome-512x512.png',
  preferredNetwork: NetworkType.MAINNET,
})

Tezos.setWalletProvider(wallet)

export const useUserStore = create<UserState>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        address: undefined,
        proxyAddress: undefined,
        proxyName: undefined,
        subjktInfo: undefined,
        sync: async () => {
          const network = {
            type: NetworkType.MAINNET,
            rpcUrl: useLocalSettings.getState().rpcNode,
          }

          // Set the client theme
          // const theme = JSON.parse(localStorage.getItem('settings:theme'))
          // await wallet.client.setColorMode(
          //   ['midnight', 'dark'].includes(theme) ? 'dark' : 'light'
          // )

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
          set({
            address: current,
            userInfo: current && (await getUser(current)),
          })
          // console.log(this.state)
          return activeAccount?.address
        },
        unsync: async () => {
          // console.log('disconnect wallet')
          // This will clear the active account and the next "syncTaquito" will trigger a new sync
          await wallet.client.clearActiveAccount()
          set({
            address: undefined,
            proxyAddress: undefined,
            userInfo: undefined,
          })
        },
        setAccount: async () => {
          const current =
            Tezos !== undefined
              ? await wallet.client.getActiveAccount()
              : undefined
          set({
            userInfo:
              current?.address &&
              (await getUser(current.address, 'user_address')),
            address: current?.address,
          })
        },
        getBalance: async (address: string) => {
          const res = await axios.get<TzkTAccount>(
            `https://api.tzkt.io/v1/accounts/${address}`
          )
          if (res && res.data.balance) {
            return parseFloat(res.data.balance) / 1e6
          }
        },
        resetProxy: () =>
          set({ proxyAddress: undefined, proxyName: undefined }),

        registry: async (alias: string, metadata_cid: string) => {
          const subjktAddressOrProxy = get().proxyAddress || SUBJKT_CONTRACT

          return await Tezos.wallet.at(subjktAddressOrProxy).then((c) =>
            c.methods
              .registry(
                `ipfs://${metadata_cid}`
                  .split('')
                  .reduce(
                    (hex, c) =>
                      (hex += c.charCodeAt(0).toString(16).padStart(2, '0')),
                    ''
                  ),
                alias
                  .split('')
                  .reduce(
                    (hex: string, c: string) =>
                      (hex += c.charCodeAt(0).toString(16).padStart(2, '0')),
                    ''
                  )
              )
              .send({ amount: 0 })
          )
        },
        swap: async (
          from,
          royalties,
          xtz_per_objkt,
          objkt_id,
          creator,
          objkt_amount
        ) => {
          const { proxyAddress } = get()
          const show = useModalStore.getState().show
          const step = useModalStore.getState().step

          step('Swap', 'Preparing swap')
          if (proxyAddress) {
            /* collab contract swap case */
            const proxyContract = await Tezos.wallet.at(proxyAddress)

            const collabSwapCall = await createLambdaSwapCall(
              proxyContract,
              MAIN_MARKETPLACE_CONTRACT,
              HEN_CONTRACT_FA2,
              objkt_id,
              proxyAddress,
              objkt_amount,
              xtz_per_objkt,
              royalties,
              creator
            )

            const operations = [
              createAddOperatorCall(
                proxyContract,
                objkt_id,
                proxyAddress,
                MAIN_MARKETPLACE_CONTRACT
              ),
              collabSwapCall,
              createRemoveOperatorCall(
                proxyContract,
                objkt_id,
                proxyAddress,
                MAIN_MARKETPLACE_CONTRACT
              ),
            ]

            const batch = Tezos.wallet.batch(operations)
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
          try {
            const batch = Tezos.wallet.batch(operations)
            const answer = await batch.send()
            show(
              'Swap Successful',
              `[see on tzkt.io](https://tzkt.io/${answer.opHash})`
            )
          } catch (e) {
            console.error(e)
            if (e instanceof Error) {
              show('Swap (Error)', e.message)
            }
            if (e instanceof ParametersInvalidBeaconError) {
              show(`Swap (${e.title})`, e.description)
            }
          }
        },
        burn: async (objkt_id: string, amount: number) => {
          const { proxyAddress } = get()
          const close = useModalStore.getState().close
          const tz = await wallet.client.getActiveAccount()
          const objktsOrProxy = proxyAddress || HEN_CONTRACT_FA2
          const addressFrom = proxyAddress || tz?.address

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
                      amount: amount,
                    },
                  ],
                },
              ])
              .send()
          )
          close()
        },
        transfer: async (txs: [Tx]) => {
          const close = useModalStore.getState().close
          const { proxyAddress, address } = get()

          const contract = proxyAddress || HEN_CONTRACT_FA2

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

          close()
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
                amount: parseInt(listing.price),
                mutez: true,
                storageLimit: 350,
              })
            )
          } else if (['VERSUM_SWAP'].includes(listing.type)) {
            return await Tezos.wallet.at(listing.contract_address).then((c) =>
              c.methods.collect_swap('1', listing.swap_id).send({
                amount: parseInt(listing.price),
                mutez: true,
                storageLimit: 350,
              })
            )
          } else {
            throw new Error('unsupported listing')
          }
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
          const { proxyAddress } = get()
          const isSwapTeia = contract_address === MARKETPLACE_CONTRACT_TEIA
          if (proxyAddress && isSwapTeia) {
            /* collab contract cancel swap for Teia Marketplace case */
            const data = {
              marketplaceAddress: contract_address,
              swap_id: swap_id,
            }
            const preparedCancel = packData(data, teiaCancelSwapSchema)
            const { packed } = await Packer.packData(preparedCancel)
            return await Tezos.wallet
              .at(proxyAddress)
              .then((c) =>
                c.methods
                  .execute(teiaCancelSwapLambda, packed)
                  .send({ amount: 0, storageLimit: 310 })
              )
              .catch((e) => e)
          }

          /* Marketplace without collab case OR collab on V1/V2 marketplace */
          return await Tezos.wallet
            .at(proxyAddress || contract_address)
            .then((c) =>
              c.methods
                .cancel_swap(swap_id)
                .send({ amount: 0, storageLimit: 310 })
            )
            .catch((e) => e)
        },
        reswap: async (nft, price, swap) => {
          // // TODO: this function currently does not take collab contracts to account
          const { proxyAddress } = get()
          const step = useModalStore.getState().step
          const close = useModalStore.getState().close
          const show = useModalStore.getState().show

          step('Reswaping', `reswaping ${nft.token_id} for ${price}tz`)

          console.log({ nft, price, swap })
          const objkt_id = nft.token_id
          const creator = nft.artist_address
          const from = swap.seller_address

          let proxyContract = undefined
          if (proxyAddress) {
            // useModalStore.setState({
            //   message: 'reswapping is not yet supported in collab mode',
            //   progress: false,
            //   visible: true,
            //   confirm: true,
            //   confirmCallback: () => {
            //     useModalStore.setState({
            //       visible: false,
            //     })
            //   },
            // })
            // return
            proxyContract = await Tezos.wallet.at(proxyAddress)
          }

          const [objktsContract, marketplaceContract, mainMarketplaceContract] =
            await Promise.all([
              Tezos.wallet.at(HEN_CONTRACT_FA2),
              Tezos.wallet.at(swap.contract_address), // this can be either v1, v2 or teia
              Tezos.wallet.at(MAIN_MARKETPLACE_CONTRACT),
            ])

          const current_contract = proxyContract || marketplaceContract
          console.log(current_contract.methodsObject)
          const list = [
            // cancel current swap
            {
              kind: OpKind.TRANSACTION,
              ...current_contract.methods
                .cancel_swap(swap.swap_id)
                .toTransferParams({
                  amount: 0,
                  mutez: true,
                  storageLimit: 310,
                }),
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
              nft.royalties_total / 1e3,
              creator,
              MAIN_MARKETPLACE_CONTRACT_SWAP_TYPE
            ),
          ]
          console.debug(list)
          try {
            const batch = Tezos.wallet.batch(list)
            const answer = await batch.send()
            if (answer.opHash) {
              show(
                'Reswap Successful',
                `[see on tzkt.io](https://tzkt.io/${answer.opHash})`
              )
            }
            return answer
          } catch (e) {
            if (e instanceof Error) show(`Reswap Error`, e.message)
            if (e instanceof ParametersInvalidBeaconError)
              show(`Reswap Error (${e.title})`, e.description)
            console.error(e)
          }
        },
        mint: async (tz, amount, cid, royalties) => {
          // show feedback component with following message and progress indicator
          const { show } = useModalStore.getState()
          const { proxyAddress } = get()
          console.debug('CID', cid)
          const step = useModalStore.getState().step
          const close = useModalStore.getState().close

          step('Mint', 'minting OBJKT')

          const handleOpStatus = async (op: TransactionWalletOperation) => {
            try {
              const status = await op.status()
              console.debug('op', status)
              if (status === 'applied') {
                show('OBJKT minted successfully')
                return { handled: true, error: false }
              } else if (status === 'backtracked') {
                show('the transaction was backtracked. try minting again')
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
            .at(proxyAddress || MARKETPLACE_CONTRACT_V1)
            .then((c) =>
              c.methods
                .mint_OBJKT(
                  tz,
                  amount,
                  `ipfs://${cid}`
                    .split('')
                    .reduce(
                      (hex, c) =>
                        (hex += c.charCodeAt(0).toString(16).padStart(2, '0')),
                      ''
                    ),
                  royalties * 10
                )
                .send({ amount: 0, storageLimit: 310 })
            )
            .then((op) => {
              step('Mint', 'confirming transaction')
              return op
                .confirmation(1)
                .then(async () => {
                  const { handled, error } = await handleOpStatus(op)
                  if (!handled) {
                    show(DEFAULT_ERROR_MESSAGE)
                  }
                  return !error
                })
                .catch(async (err) => {
                  console.error(err)
                  const { handled, error } = await handleOpStatus(op)
                  if (!handled) {
                    const message =
                      err.message === 'Confirmation polling timed out'
                        ? 'a timeout occurred, but the mint might have succeeded'
                        : DEFAULT_ERROR_MESSAGE
                    show('Mint (Error)', message)
                    return !error
                  }

                  return false
                })
            })
            .catch((error) => {
              console.error(error)
              show(DEFAULT_ERROR_MESSAGE)
              return false
            })
        },
      }),
      {
        name: 'user',
        storage: createJSONStorage(() => localStorage), // or sessionStorage?
      }
    )
  )
)
