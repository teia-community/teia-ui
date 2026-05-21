import { BeaconWallet } from '@taquito/beacon-wallet'
import { BeaconEvent } from '@ecadlabs/beacon-dapp'
import {
  OpKind,
  MichelCodecPacker,
  TezosToolkit,
  WalletOperationBatch,
  ContractMethodObject,
  Wallet,
  WalletParamsWithKind,
  MichelsonMap,
} from '@taquito/taquito'
import { stringToBytes } from '@taquito/utils'
import { create } from 'zustand'
import {
  persist,
  createJSONStorage,
  subscribeWithSelector,
} from 'zustand/middleware'
import { useLocalSettings } from './localSettingsStore'
import { NetworkType } from '@ecadlabs/beacon-types'
import { getUser, getTokenInformationOnCollect, GetUserMetadata } from '@data/api'
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
    op_to_send: WalletOperationBatch | ContractMethodObject<Wallet>,
    title: string,
    send_options?: {
      amount: number
      mutez?: boolean
      storageLimit?: number
    },
    opOptions?: { skipSuccessModal?: boolean; swapId?: number }
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
  /** Donate amount */
  donate: (amount: number, destinationAddress: string) => OperationReturn
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

// ---------------------------------------------------------------------------
// Wallet / Tezos setup
// ---------------------------------------------------------------------------

const getRpc = () => String(useLocalSettings.getState().getRpcNode())
const normalize = (url: string) => String(url).replace(/\/$/, '')

// const rpcClient = new CancellableRpcClient(useLocalSettings.getState().rpcNode)
export const Tezos = new TezosToolkit(getRpc())
const Packer = new MichelCodecPacker()

const wallet = new BeaconWallet({
  name: 'teia.art',
  appUrl: 'https://teia.art',
  iconUrl: 'https://teia.art/icons/android-chrome-512x512.png',
  // Beacon no longer accepts `network` on requestPermissions — set it here (DAppClientOptions).
  network: {
    type: NetworkType.MAINNET,
    rpcUrl: getRpc(), // shared read with Tezos init — can't drift
  },
})

Tezos.setWalletProvider(wallet)

/** Update the Tezos toolkit RPC provider after a successful sync with a new node. */
export const updateRpcProvider = (rpcUrl: string) => {
  Tezos.setRpcProvider(rpcUrl)
}

// Passive listener — keeps activeAddress in sync with Beacon events.
// Not used for auth decisions; prefer wallet.getPKH() or getActiveAccount() for that.
export let activeAddress: string | undefined

wallet.client.subscribeToEvent(
  BeaconEvent.ACTIVE_ACCOUNT_SET,
  (account) => {
    activeAddress = account?.address
  }
)

// ---------------------------------------------------------------------------
// Shared state helpers
// ---------------------------------------------------------------------------

const emptyWalletState = {
  address: undefined,
  userInfo: undefined,
  proxyAddress: undefined,
  proxyName: undefined,
}

/**
 * Shared helper used by sync and setAccount.
 * Sets address immediately, then fetches user info non-fatally.
 */
const applyAccount = async (
  address: string,
  setState: (partial: Partial<UserState>) => void
): Promise<string> => {
  setState({ address })
  try {
    const info = await getUser(address, 'user_address')
    setState({ userInfo: info })
  } catch (e) {
    console.warn('Failed to fetch user info:', e)
  }
  return address
}

// ---------------------------------------------------------------------------
// Socials helper
// ---------------------------------------------------------------------------

const IGNORED_PROFILE_KEYS = new Set(['kind', 'description', 'alias'])

const buildSocialsMessage = (profile: Record<string, unknown>): string => {
  const socialKeys = Object.keys(profile).filter(
    (key) => !IGNORED_PROFILE_KEYS.has(key)
  )
  return socialKeys.length > 0 ? `Please share on ${socialKeys.join(', ')}` : ''
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useUserStore = create<UserState>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        address: undefined,
        proxyAddress: undefined,
        proxyName: undefined,
        subjktInfo: undefined,

        handleOp: async (op_to_send, title, send_options, opOptions) => {
          const step = useModalStore.getState().step
          const show = useModalStore.getState().show
          const showError = useModalStore.getState().showError
          const skipSuccessModal =
            Boolean(opOptions?.skipSuccessModal) && title === 'Mint'

          // After 15 sec suggest the user to cancel — transaction continues regardless.
          const timeout = setTimeout(() => {
            show(
              title,
              'Something seems to hang, did you abort the transaction?'
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

            if (opOptions?.swapId != null) {
              // get token information
              const token_info = await getTokenInformationOnCollect(
                opOptions.swapId
              )
              const token_name = token_info.token.name
                ? token_info.token.name
                : `#${token_info.token_id}`
              const artist_address = token_info.token.artist_profile?.name
                ? token_info.token.artist_profile.name
                : token_info.token.artist_address

              // Get socials linked to the current user
              let socialsText = ''
              if (activeAddress) {
                try {
                  const user_info = await GetUserMetadata(activeAddress)
                  const profile = user_info?.extras?.profile
                  if (profile && typeof profile === 'object') {
                    socialsText = buildSocialsMessage(profile as Record<string, unknown>)
                  }
                } catch (e) {
                  console.warn('Failed to fetch user socials:', e)
                }
              }

              const collect_message =
                `\n` +
                `I just collected "${token_name}" by ${artist_address}\n` +
                `https://teia.art/objkt/${token_info.token_id}\n` +
                `\n\n` +
                `${socialsText}` +
                `\n\n` +
                `Remember to #SwapOnTeia`

              show(
                confirm?.completed ? `${title} Successful` : `${title} Error`,
                collect_message
              )
            } else if (!(skipSuccessModal && confirm?.completed)) {
              show(
                confirm?.completed ? `${title} Successful` : `${title} Error`,
                `[see on tzkt.io](https://tzkt.io/${op.opHash})`
              )
            }
            return op.opHash
          } catch (e) {
            showError('Transfer', e)
          }
        },

        sync: async (opts) => {
          const rpcUrl = normalize(
            opts?.rpcNode || useLocalSettings.getState().getRpcNode()
          )

          let activeAccount = await wallet.client.getActiveAccount()

          // We check the storage and only do a permission request if we don't have an active account yet
          // This piece of code should be called on startup to "load" the current address from the user
          // If the activeAccount is present, no "permission request" is required again, unless the user "disconnects" first.
          if (
            activeAccount === undefined ||
            normalize(activeAccount?.network?.rpcUrl ?? '') !== rpcUrl
          ) {
            try {
              await wallet.requestPermissions()
            } catch (e) {
              console.warn('Permission request cancelled or failed:', e)
              return undefined
            }
            activeAccount = await wallet.client.getActiveAccount()
          }

          const current = await wallet.getPKH()

          if (!current) {
            console.warn('No PKH available after sync')
            return undefined
          }

          // Keep toolkit RPC in sync with the negotiated node
          updateRpcProvider(rpcUrl)

          return applyAccount(current, set)
        },

        unsync: () => {
          // Clear local state immediately — don't wait for wallet peer notification,
          // which can hang if the extension is slow or unreachable.
          set(emptyWalletState)
          wallet.disconnect().catch((e) => console.warn('Disconnect failed:', e))
        },

        setAccount: async () => {
          // Tezos being defined is a proxy check for wallet readiness
          if (Tezos === undefined) return

          const current = await wallet.client.getActiveAccount()

          if (!current?.address) return

          await applyAccount(current.address, set)
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

        resetProxy: () => set({ proxyAddress: undefined, proxyName: undefined }),

        registry: async (alias, metadata_cid) => {
          const handleOp = get().handleOp
          const subjktAddressOrProxy = get().proxyAddress || SUBJKT_CONTRACT
          const contract = await Tezos.wallet.at(subjktAddressOrProxy)
          const op = contract.methodsObject.registry({
            metadata: stringToBytes(`ipfs://${metadata_cid}`),
            subjkt: stringToBytes(alias),
          })
          return await handleOp(op, 'Editing Profile', { amount: 0 })
        },

        swap: async (from, royalties, xtz_per_objkt, objkt_id, creator, objkt_amount) => {
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
              createAddOperatorCall(proxyContract, objkt_id, proxyAddress, MAIN_MARKETPLACE_CONTRACT),
              collabSwapCall,
              createRemoveOperatorCall(proxyContract, objkt_id, proxyAddress, MAIN_MARKETPLACE_CONTRACT),
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

          try {
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
            return await handleOp(Tezos.wallet.batch(operations), 'Swap')
          } catch (e) {
            showError('Swap', e)
          }
        },

        burn: async (objkt_id, amount) => {
          const { proxyAddress, handleOp } = get()
          const step = useModalStore.getState().step
          step('Burn', `Burning ${amount} edition of OBJKT #${objkt_id}`, true)

          const tz = await wallet.client.getActiveAccount()
          const objktsOrProxy = proxyAddress || HEN_CONTRACT_FA2
          const addressFrom = proxyAddress || tz?.address

          console.debug('Using', objktsOrProxy, 'for burn')

          const contract = await Tezos.wallet.at(objktsOrProxy)
          const batch = contract.methodsObject.transfer([
            {
              from_: addressFrom,
              txs: [{ to_: BURN_ADDRESS, token_id: parseInt(objkt_id), amount }],
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
            const batch = connect.methodsObject.transfer([
              { from_: proxyAddress || address, txs },
            ])
            return await handleOp(batch, 'Transfer')
          } catch (e) {
            showError('Transfer', e)
          }
        },

        donate: async (amount, destinationAddress) => {
          const handleOp = get().handleOp
          const showError = useModalStore.getState().showError
          const show = useModalStore.getState().show

          if (isNaN(amount) || amount <= 0) {
            show('Invalid amount', 'Please enter a valid donation amount')
            return
          }
          try {
            await get().sync()
            const list: WalletParamsWithKind[] = [
              { to: destinationAddress, amount, kind: OpKind.TRANSACTION },
            ]
            return await handleOp(Tezos.wallet.batch(list), 'Donate')
          } catch (e) {
            showError('Donate', e)
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
              batch = contract.methodsObject.collect(parseInt(listing.swap_id))
            } else if (['OBJKT_ASK', 'OBJKT_ASK_V2'].includes(listing.type)) {
              const contract = await Tezos.wallet.at(listing.contract_address)
              batch = contract.methodsObject.fulfill_ask({ ask_id: parseInt(listing.ask_id) })
            } else if (['OBJKT_ASK_V3', 'OBJKT_ASK_V3_PRE', 'OBJKT_ASK_V3_2'].includes(listing.type)) {
              const contract = await Tezos.wallet.at(listing.contract_address)
              batch = contract.methodsObject.fulfill_ask({
                ask_id: listing.ask_id,
                amount: 1,
                proxy_for: null,
                condition_extra: null,
                referrers: MichelsonMap.fromLiteral({}),
              })
            } else if (['VERSUM_SWAP'].includes(listing.type)) {
              const contract = await Tezos.wallet.at(listing.contract_address)
              batch = contract.methodsObject.collect_swap(['1', listing.swap_id])
            }

            const swapId = ['HEN_SWAP_V2', 'TEIA_SWAP'].includes(listing.type)
              ? parseInt(listing.swap_id)
              : undefined

            if (batch) {
              return await handleOp(batch, 'Collect', {
                amount: parseInt(listing.price),
                mutez: true,
                storageLimit: 350,
              }, { swapId })
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
              c.methodsObject
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
            const data = {
              marketplaceAddress: contract_address,
              swap_id: swap_id,
            }

            const preparedCancel = packData(data, teiaCancelSwapSchema)
            const { packed } = await Packer.packData(preparedCancel)
            const contract = await Tezos.wallet.at(proxyAddress)

            const batch = contract.methodsObject.execute({
              lambda: teiaCancelSwapLambda,
              packedParams: packed,
            })

            return handleOp(batch, 'Cancel Swap', {
              amount: 0,
              storageLimit: 310,
            })
          }

          /* Marketplace without collab case OR collab on V1/V2 marketplace */
          const contract = await Tezos.wallet.at(proxyAddress || contract_address)
          const batch = contract.methodsObject.cancel_swap(swap_id)
          return handleOp(batch, 'Cancel Swap', {
            amount: 0,
            storageLimit: 310,
          })
        },

        reswap: async (nft, price, swap) => {
          // TODO: this function currently does not take collab contracts into account
          const { proxyAddress, handleOp } = get()
          const step = useModalStore.getState().step
          const showError = useModalStore.getState().showError
          const show = useModalStore.getState().show

          step('Reswapping', `reswapping ${nft.token_id} for ${price / 1e6}tz`, true)

          console.debug({ nft, price, swap })

          if (proxyAddress) {
            show('Reswap', 'reswapping is not yet supported in collab mode')
            return
            // proxyContract = await Tezos.wallet.at(proxyAddress)
          }

          const objkt_id = nft.token_id
          const creator = nft.artist_address
          const from = swap.seller_address

          const [objktsContract, marketplaceContract, mainMarketplaceContract] =
            await Promise.all([
              Tezos.wallet.at(HEN_CONTRACT_FA2),
              Tezos.wallet.at(swap.contract_address),
              Tezos.wallet.at(MAIN_MARKETPLACE_CONTRACT),
            ])

          const list: WalletParamsWithKind[] = [
            {
              kind: OpKind.TRANSACTION,
              ...marketplaceContract.methodsObject
                .cancel_swap(swap.swap_id)
                .toTransferParams({ amount: 0, mutez: true, storageLimit: 310 }),
            },
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
            return await handleOp(Tezos.wallet.batch(list), 'Reswap')
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

          const contract = await Tezos.wallet.at(proxyAddress || MARKETPLACE_CONTRACT_V1)
          const mint_batch = contract.methodsObject.mint_OBJKT({
            address: tz,
            amount,
            metadata: `ipfs://${cid}`
              .split('')
              .reduce(
                (hex, c) => (hex += c.charCodeAt(0).toString(16).padStart(2, '0')),
                ''
              ),
            royalties: royalties * 10,
          })

          return await handleOp(
            mint_batch,
            'Mint',
            { amount: 0, storageLimit: 310 },
            { skipSuccessModal: !proxyAddress }
          )
        },
      }),
      {
        name: 'user',
        // Bump this version whenever a Beacon/Taquito upgrade changes the
        // localStorage format. All persisted state is discarded and the user
        // will be asked to reconnect — better than a broken unsync button.
        version: 3,
        migrate: async () => {
          // clearActiveAccount is local-only and resolves fast, ensuring
          // setAccount() on mount won't re-sync from Beacon before migrate returns.
          // disconnect() notifies wallet peers but can hang — run it in the background.
          try {
            await wallet.client.clearActiveAccount()
          } catch (e) {
            console.warn('Migration: failed to clear Beacon account:', e)
          }
          wallet.disconnect().catch((e) =>
            console.warn('Migration: disconnect failed:', e)
          )
          return {} as UserState
        },
        storage: createJSONStorage(() => localStorage),
        onRehydrateStorage: () => (state) => {
          if (!state?.address) return
          // Beacon runs its own migrations and can silently clear account data
          // when the SDK version changes. If Zustand thinks we're connected but
          // Beacon has no active account, the stored address is stale — clear it
          // so the UI doesn't show a phantom connected state.
          wallet.client
            .getActiveAccount()
            .then((account) => {
              if (!account) {
                useUserStore.setState(emptyWalletState)
              }
            })
            .catch(() => {
              useUserStore.setState(emptyWalletState)
            })
        },
      }
    )
  )
)