import { create } from 'zustand'
import {
  persist,
  createJSONStorage,
  subscribeWithSelector,
} from 'zustand/middleware'

type ViewMode = 'single' | 'masonry'

type Theme = 'dark' | 'light' | 'kawai' | 'aqua' | 'coffee' | 'midnight'

export const rpc_nodes = [
  'https://mainnet.api.tez.ie',
  'https://mainnet.smartpy.io',
  'https://rpc.tzbeta.net',
  'https://mainnet-tezos.giganode.io',
  'https://mainnet.tezos.marigold.dev',
  'https://eu01-node.teztools.net',
  'https://rpc.tzkt.io/mainnet',
  'custom',
] as const

type RPC_NODES = typeof rpc_nodes[number]

interface LocalSettingsState {
  viewMode: ViewMode
  nsfwFriendly: boolean
  photosensitiveFriendly: boolean
  zen: boolean
  theme: Theme
  themeDark: Theme
  themeLight: Theme
  rpcNode: RPC_NODES
  toggleViewMode: () => void
  toggleZen: () => void
  setZen: (zen: boolean) => void
  toggleTheme: () => void
  setViewMode: (mode: ViewMode) => void
  setTheme: (theme: Theme) => void
  setNsfwFriendly: (v: boolean) => void
  setPhotosensitiveFriendly: (v: boolean) => void
}

export const useLocalSettings = create<LocalSettingsState>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        viewMode: 'single',
        nsfwFriendly: false,
        photosensitiveFriendly: false,
        zen: false,
        theme: 'dark',
        themeDark: 'dark',
        themeLight: 'light',
        rpcNode: rpc_nodes[0],
        toggleViewMode: () =>
          set((state) => ({
            viewMode: state.viewMode === 'single' ? 'masonry' : 'single',
          })),
        toggleZen: () => set((state) => ({ zen: !state.zen })),
        setZen: (zen) => set({ zen }),
        toggleTheme: () =>
          set((state) => ({
            theme:
              state.theme === state.themeDark
                ? state.themeLight
                : state.themeDark,
          })),
        setViewMode: (viewMode: ViewMode) => set({ viewMode }),
        setTheme: (theme: Theme) => set({ theme }),
        setRpcNode: (rpcNode: RPC_NODES) => set({ rpcNode }),
        setNsfwFriendly: (nsfwFriendly) => set({ nsfwFriendly }),
        setPhotosensitiveFriendly: (photosensitiveFriendly) =>
          set({ photosensitiveFriendly }),
      }),
      {
        name: 'settings',
        storage: createJSONStorage(() => localStorage), // or sessionStorage?
      }
    )
  )
)
