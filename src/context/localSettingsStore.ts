import { create } from 'zustand'
import {
  persist,
  createJSONStorage,
  subscribeWithSelector,
} from 'zustand/middleware'
// import { useModalStore } from './modalStore'
import { FEED_LIST, DEFAULT_START_FEED } from '@constants'

type ViewMode = 'single' | 'masonry'

export type Theme = 'dark' | 'light' | 'kawai' | 'aqua' | 'coffee' | 'midnight'

export const rpc_nodes = [
  'https://mainnet.teia.rocks',
  'https://mainnet.smartpy.io',
  'https://rpc.tzbeta.net',
  'https://mainnet.tezos.marigold.dev',
  'https://rpc.tzkt.io/mainnet',
  'https://mainnet.api.tez.ie',
  'custom',
] as const

type FeedType = (typeof FEED_LIST)[number]

export type RPC_NODES = (typeof rpc_nodes)[number]

interface LocalSettingsState {
  applyTheme: (theme: Theme) => void
  has_seen_banner: boolean
  nsfwFriendly: boolean
  photosensitiveFriendly: boolean
  startFeed: FeedType
  rpcNode: RPC_NODES
  /** Use this to query the current rpc url since it will also resolve the custom one.*/
  getRpcNode: () => RPC_NODES | string
  customRpcNode: string
  setCustomRpcNode: (v: string) => void
  setNsfwFriendly: (v: boolean) => void
  setPhotosensitiveFriendly: (v: boolean) => void
  setStartFeed: (v: FeedType | undefined) => void
  setRpcNode: (rpcNode?: RPC_NODES) => Promise<void>
  setTheme: (theme: Theme, apply?: boolean) => void
  setTilted: (tilted: boolean) => void
  setViewMode: (mode: ViewMode) => void
  setHasSeenBanner: (seen: boolean) => void
  setZen: (zen: boolean) => void
  theme: Theme
  themeDark: Theme
  themeLight: Theme
  tilted: boolean
  toggleTheme: () => void
  toggleViewMode: () => void
  toggleZen: () => void
  viewMode: ViewMode
  zen: boolean
}

const defaultValues = {
  viewMode: 'single' as ViewMode,
  nsfwFriendly: false,
  photosensitiveFriendly: false,
  startFeed: DEFAULT_START_FEED,
  zen: false,
  theme: 'dark' as Theme,
  themeDark: 'dark' as Theme,
  themeLight: 'light' as Theme,
  rpcNode: rpc_nodes[0],
  customRpcNode: '',
  tilted: false,
  has_seen_banner: false,
}
// TODO: replace all the "set" methods with one that merges the state with the provided partial object
export const useLocalSettings = create<LocalSettingsState>()(
  subscribeWithSelector(
    persist<LocalSettingsState>(
      (set, get) => ({
        ...defaultValues,
        setHasSeenBanner: (has_seen_banner) => set({ has_seen_banner }),
        setTilted: (tilted) => set({ tilted }),
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
        setTheme: (theme, apply) => {
          set({ theme })
          if (apply) {
            get().applyTheme(theme)
          }
        },
        applyTheme: (theme) => {
          const root = document.documentElement
          root.setAttribute('data-theme', theme)
        },
        getRpcNode: () => {
          const rpcNode = get().rpcNode
          if (rpcNode === 'custom') {
            const custom = get().customRpcNode
            return custom || rpcNode
          }
          return rpcNode
        },
        setCustomRpcNode: (customRpcNode: string) => {
          if (!customRpcNode) {
            return
          }
          if (!customRpcNode.startsWith('http')) {
            customRpcNode = `https://${customRpcNode}`
          }
          set({ customRpcNode })
        },
        setRpcNode: async (rpcNode) => {
          // const show = useModalStore.getState().show
          set({ rpcNode })
          // show(
          //   'RPC Node Changed',
          //   'Please reload the page for it to take effect.'
          // )
          // await useUserStore.getState().sync({ rpcNode })
        },
        setNsfwFriendly: (nsfwFriendly) => set({ nsfwFriendly }),
        setPhotosensitiveFriendly: (photosensitiveFriendly) =>
          set({ photosensitiveFriendly }),
        setStartFeed: (startFeed) => set({ startFeed }),
      }),
      {
        name: 'settings',
        storage: createJSONStorage(() => localStorage), // or sessionStorage?
        version: 2,
        partialize: (state) =>
          Object.fromEntries(
            Object.entries(state).filter(([key]) =>
              Object.keys(defaultValues).includes(key)
            )
          ) as LocalSettingsState,
        onRehydrateStorage: (state) => {
          return (state, error) => {
            if (error) {
              console.error('an error happened during hydration', error)
            }
          }
        },
        migrate: (persistedState: any, version: number) => {
          console.debug('migrating settings from version', version)
          // here we can check against the version of the storage and makes updates accordingly.
          // useful to rename keys or restore value, we will first use it for the banner updates.
          persistedState.has_seen_banner = false

          return persistedState
        },
      }
    )
  )
)
