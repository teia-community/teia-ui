import { BeaconWallet } from '@taquito/beacon-wallet'
import { TezosToolkit } from '@taquito/taquito'
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { NetworkType } from '@airgap/beacon-types'
import { useUserStore } from './userStore'

const SHADOWNET_RPC =
  import.meta.env.VITE_SHADOWNET_RPC || 'https://shadownet.tezos.ecadinfra.com'

const SHADOWNET_TZKT =
  import.meta.env.VITE_SHADOWNET_TZKT_API || 'https://api.shadownet.tzkt.io'

export const ShadownetTezos = new TezosToolkit(SHADOWNET_RPC)

// We don't create the wallet at module load.
// Instead we create it on-demand during sync() to avoid
// Beacon peer connection conflicts with the mainnet wallet.
let shadownetWallet: BeaconWallet | null = null

function getOrCreateWallet(): BeaconWallet {
  if (!shadownetWallet) {
    shadownetWallet = new BeaconWallet({
      name: 'teia-shadownet',
      appUrl: 'https://teia.art',
      iconUrl: 'https://teia.art/icons/android-chrome-512x512.png',
      preferredNetwork: 'shadownet' as NetworkType,
      network: {
        type: 'shadownet' as NetworkType,
        name: 'shadownet',
        rpcUrl: SHADOWNET_RPC,
      },
    })
    ShadownetTezos.setWalletProvider(shadownetWallet)
  }
  return shadownetWallet
}

interface ShadownetState {
  address?: string
  balance?: number
  sync: () => Promise<string | undefined>
  unsync: () => void
  setAccount: () => void
  getBalance: (address?: string) => Promise<number>
}

export const useShadownetStore = create<ShadownetState>()(
  persist(
    (set, get) => ({
      address: undefined,
      balance: undefined,

      sync: async () => {
        // Disconnect the mainnet wallet first so Beacon's peer
        // connection is free for our Shadownet request.
        const mainnetAddress = useUserStore.getState().address
        if (mainnetAddress) {
          await useUserStore.getState().unsync()
        }

        // Clear any previous shadownet session (but don't destroy
        // the client — Beacon can't cleanly rebuild after destroy).
        if (shadownetWallet) {
          await shadownetWallet.client.clearActiveAccount()
        }

        const wallet = getOrCreateWallet()

        await wallet.requestPermissions()

        const account = await wallet.client.getActiveAccount()
        if (account?.address) {
          set({ address: account.address })
          return account.address
        }
      },

      unsync: async () => {
        if (shadownetWallet) {
          await shadownetWallet.client.clearActiveAccount()
        }
        set({ address: undefined, balance: undefined })
      },

      setAccount: async () => {
        // Only restore if we have a persisted address — don't create
        // the wallet eagerly (that would conflict with mainnet).
        const persisted = get().address
        if (!persisted) return

        const wallet = getOrCreateWallet()
        const account = await wallet.client.getActiveAccount()
        if (account?.address) {
          set({ address: account.address })
        } else {
          // Beacon session expired — clear persisted address
          set({ address: undefined })
        }
      },

      getBalance: async (address?: string) => {
        const target = address || get().address
        if (!target) return -1
        const balance = await ShadownetTezos.tz.getBalance(target)
        const balNum = balance.toNumber()
        set({ balance: balNum })
        return balNum
      },
    }),
    {
      name: 'shadownet-user',
      storage: createJSONStorage(() => localStorage),
    }
  )
)

export { SHADOWNET_RPC, SHADOWNET_TZKT }
