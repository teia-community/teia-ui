import { BeaconWallet } from '@taquito/beacon-wallet'
import {
  OpKind,
  MichelCodecPacker,
  TezosToolkit,
  WalletOperationBatch,
  ContractMethod,
  Wallet,
  WalletParamsWithKind,
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
import type { RPC_NODES } from './localSettingsStore'
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
import type { Listing, NFT, SubjktInfo, Tx } from '@types'

// type OperationReturn = Promise<string | TransactionWalletOperation | undefined>
type OperationReturn = Promise<string | undefined>

interface SyncOptions {
  rpcNode?: RPC_NODES
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
  /** Handle the operation confirmation and error and return the ophash */
  handleOp: (
    // op: TransactionWalletOperation | BatchWalletOperation,
    op_to_send: WalletOperationBatch | ContractMethod<Wallet>,
    title: string,
    send_options?: {
      amount: number
      mutez?: boolean
      storageLimit?: number
    }
  ) => OperationReturn
  /** Wallet sync  */
  sync: (opts?: SyncOptions) => OperationReturn
  /** Wallet unsync  */
  unsync: () => void
  /** Register SUBJKT  */
  registry: (alias: string, metadata_cid: string) => OperationReturn
  /** Swap token returns the ophash  */
  swap: (
    from: string,
    royalties: number,
    xtz_per_objkt: number,
    objkt_id: string,
    creator: string,
    objkt_amount: number
  ) => OperationReturn
  /** Burn Token */
  burn: (objkt_id: string, amount: number) => OperationReturn
  /** Reswap Token */
  reswap: (nft: NFT, price: number, swap: Listing) => OperationReturn
  /** Collect token */
  collect: (listing: {
    type: string
    contract_address: string
    swap_id: string
    price: string
    ask_id: any
  }) => OperationReturn
  /** Cancel Swap */
  cancel: (contract: string, swap_id: number) => OperationReturn
  /** Cancel Swap from V1 */
  cancelV1: (swapid: string) => OperationReturn
  /** Retrieve account from localStorage (beacon mechanism) */
  setAccount: () => void
  /** Set the proxy address */
  resetProxy: () => void
  /**Transfer tokens */
  transfer: (txs: Tx[]) => OperationReturn
  /** Get the balance for the given address (or current user if not provided) */
  getBalance: (address?: string) => Promise<number>
  /** Mint the token */
  mint: (
    tz: string,
    amount: number,
    cid: string,
    royalties: number
  ) => OperationReturn
}
// const rpcClient = new CancellableRpcClient(useLocalSettings.getState().rpcNode)
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
        handleOp: async (op_to_send, title, send_options) => {
          const step = useModalStore.getState().step
          const show = useModalStore.getState().show
          const showError = useModalStore.getState().showError

          // After 15sec suggest the user to cancel, it will go on
          // if they accept the tx
          const timeout = setTimeout(() => {
            show(
              title,
              'Something seem to hang, did you abort the transaction?'
            )
          }, 15000)

          const op = await op_to_send.send(send_options)

          clearTimeout(timeout)

          try {
            step(
              title,
              `Awaiting for confirmation of the [operation](https://tzkt.io/${op.opHash})
              *closing this dialog has no effect on the transaction*`
            )
            // skippable
            useModalStore.setState({ confirm: true })
            const confirm = await op.confirmation()
            show(
              confirm.completed ? `${title} Successful` : `${title} Error`,
              `[see on tzkt.io](https://tzkt.io/${op.opHash})`
            )
            return op.opHash
          } catch (e) {
            showError('Transfer', e)
          }
        },
        sync: async (opts) => {
          const network = {
            type: NetworkType.MAINNET,
            rpcUrl: opts?.rpcNode || useLocalSettings.getState().rpcNode,
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
          if (
            activeAccount === undefined ||
            activeAccount?.network?.rpcUrl !== network.rpcUrl
          ) {
            await wallet.requestPermissions({ network })
            activeAccount = await wallet.client.getActiveAccount()
          }
          const current = await wallet.getPKH()
          if (current) {
            const info = await getUser(current)
            console.log('getting user info', info)
            set({
              address: current,
              userInfo: await getUser(current),
            })
          }

          // console.log(this.state)
          return current
        },
        unsync: async () => {
          // console.log('disconnect wallet')
          // This will clear the active account and the next "syncTaquito" will trigger a new sync
          await wallet.client.clearActiveAccount()
          set({
            address: undefined,
            userInfo: undefined,
            proxyAddress: undefined,
            proxyName: undefined,
          })
        },
        setAccount: async () => {
          const current =
            Tezos !== undefined
              ? await wallet.client.getActiveAccount()
              : undefined
          if (current?.address) {
            set({
              userInfo: await getUser(current.address, 'user_address'),
              address: current.address,
            })
          }
        },
        getBalance: async (address) => {
          if (address) {
            const balance = await Tezos.tz.getBalance(address)
            return balance.toNumber()
          }
          const user_address = get().address
          const proxyAddress = get().proxyAddress
          if (user_address) {
            const balance = await Tezos.tz.getBalance(
              proxyAddress || user_address
            )
            return balance.toNumber()
          }

          return -1
        },
        resetProxy: () =>
          set({ proxyAddress: undefined, proxyName: undefined }),
        registry: async (alias, metadata_cid) => {
          const handleOp = get().handleOp
          const subjktAddressOrProxy = get().proxyAddress || SUBJKT_CONTRACT

          const contract = await Tezos.wallet.at(subjktAddressOrProxy)
          const op = contract.methods.registry(
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
          return await handleOp(op, 'Editing Profile', { amount: 0 })
        },
        swap: async (
          from,
          royalties,
          xtz_per_objkt,
          objkt_id,
          creator,
          objkt_amount
        ) => {
          const { proxyAddress, handleOp } = get()
          const showError = useModalStore.getState().showError
          const step = useModalStore.getState().step

          step('Swap', 'Preparing swap', true)
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

            const operations: WalletParamsWithKind[] = [
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

            // const op = await batch.send()

            return await handleOp(batch, 'Swap')
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

            return await handleOp(batch, 'Swap')
          } catch (e) {
            showError('Swap', e)
          }
        },
        burn: async (objkt_id: string, amount: number) => {
          const { proxyAddress, handleOp } = get()
          const step = useModalStore.getState().step
          step('Burn', `Burning ${amount} edition of OBJKT #${objkt_id}`, true)

          const tz = await wallet.client.getActiveAccount()
          const objktsOrProxy = proxyAddress || HEN_CONTRACT_FA2
          const addressFrom = proxyAddress || tz?.address

          console.debug('Using', objktsOrProxy, 'for burn')

          const contract = await Tezos.wallet.at(objktsOrProxy)
          const batch = contract.methods.transfer([
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

          return await handleOp(batch, 'Burn')
        },
        transfer: async (txs) => {
          const handleOp = get().handleOp
          const showError = useModalStore.getState().showError
          const step = useModalStore.getState().step

          step('Transferring tokens', 'Waiting for confirmation', true)
          const { proxyAddress, address } = get()

          const contract = proxyAddress || HEN_CONTRACT_FA2

          try {
            const connect = await Tezos.wallet.at(contract)

            const batch = connect.methods.transfer([
              {
                from_: proxyAddress || address,
                txs,
              },
            ])

            return await handleOp(batch, 'Transfer')
          } catch (e) {
            showError('Transfer', e)
          }
        },
        collect: async (listing) => {
          const handleOp = get().handleOp
          const show = useModalStore.getState().show
          const showError = useModalStore.getState().showError

          let batch = undefined

          try {
            if (['HEN_SWAP_V2', 'TEIA_SWAP'].includes(listing.type)) {
              const contract = await Tezos.wallet.at(listing.contract_address)
              batch = contract.methods.collect(parseInt(listing.swap_id))
            } else if (['OBJKT_ASK', 'OBJKT_ASK_V2'].includes(listing.type)) {
              const contract = await Tezos.wallet.at(listing.contract_address)
              batch = contract.methods.fulfill_ask(listing.ask_id)
            } else if (['VERSUM_SWAP'].includes(listing.type)) {
              const contract = await Tezos.wallet.at(listing.contract_address)
              batch = contract.methods.collect_swap('1', listing.swap_id)
            }
            if (batch) {
              return await handleOp(batch, 'Collect', {
                amount: parseInt(listing.price),
                mutez: true,
                storageLimit: 350,
              })
            } else {
              show('Collect Error', 'unsupported listing')
            }
          } catch (error) {
            showError('Collect', error)
          }
        },
        cancelV1: async (swap_id) => {
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
          const { proxyAddress, handleOp } = get()
          const step = useModalStore.getState().step

          step('Cancel Swap', 'Waiting for wallet', true)

          const isSwapTeia = contract_address === MARKETPLACE_CONTRACT_TEIA
          if (proxyAddress && isSwapTeia) {
            /* collab contract cancel swap for Teia Marketplace case */
            const data: any = {
              marketplaceAddress: contract_address,
              swap_id: swap_id,
            }
            const preparedCancel = packData(data, teiaCancelSwapSchema)
            const { packed } = await Packer.packData(preparedCancel)
            const contract = await Tezos.wallet.at(proxyAddress)
            const batch = contract.methods.execute(teiaCancelSwapLambda, packed)

            return handleOp(batch, 'Cancel Swap', {
              amount: 0,
              storageLimit: 310,
            })
          }

          /* Marketplace without collab case OR collab on V1/V2 marketplace */
          const contract = await Tezos.wallet.at(
            proxyAddress || contract_address
          )

          const batch = contract.methods.cancel_swap(swap_id)

          return handleOp(batch, 'Cancel Swap', {
            amount: 0,
            storageLimit: 310,
          })
        },
        reswap: async (nft, price, swap) => {
          // TODO: this function currently does not take collab contracts to account
          const { proxyAddress, handleOp } = get()
          const step = useModalStore.getState().step
          const showError = useModalStore.getState().showError
          const show = useModalStore.getState().show

          step(
            'Reswaping',
            `reswaping ${nft.token_id} for ${price / 1e6}tz`,
            true
          )

          console.debug({ nft, price, swap })
          const objkt_id = nft.token_id
          const creator = nft.artist_address
          const from = swap.seller_address

          let proxyContract = undefined
          if (proxyAddress) {
            show('Reswap', 'reswapping is not yet supported in collab mode')
            return
            // proxyContract = await Tezos.wallet.at(proxyAddress)
          }

          const [objktsContract, marketplaceContract, mainMarketplaceContract] =
            await Promise.all([
              Tezos.wallet.at(HEN_CONTRACT_FA2),
              Tezos.wallet.at(swap.contract_address), // this can be either v1, v2 or teia
              Tezos.wallet.at(MAIN_MARKETPLACE_CONTRACT),
            ])

          const current_contract = proxyContract || marketplaceContract

          const list: WalletParamsWithKind[] = [
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
            return await handleOp(batch, 'Reswap')
          } catch (e) {
            showError('Reswap', e)
          }
        },
        mint: async (tz, amount, cid, royalties) => {
          const handleOp = get().handleOp
          const step = useModalStore.getState().step
          const { proxyAddress } = get()
          console.debug('CID', cid)

          step('Mint', 'minting OBJKT', true)

          const contract = await Tezos.wallet.at(
            proxyAddress || MARKETPLACE_CONTRACT_V1
          )
          const mint_batch = contract.methods.mint_OBJKT(
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

          return await handleOp(mint_batch, 'Mint', {
            amount: 0,
            storageLimit: 310,
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
