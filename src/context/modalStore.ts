import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'

interface ModalOptions {
  visible?: boolean
  message?: string
  progress?: boolean
  confirm?: boolean
  confirmCallback?: () => void
}
interface ModalStore {
  /** main menu collapsed state */
  collapsed: boolean
  visible: boolean
  message: string
  progress: boolean
  confirm: boolean
  confirmCallback?: () => void
  show: (message: string) => void
  setCollapsed: (collapse: boolean) => void
  toggleMenu: () => void
}

export const useModalStore = create<ModalStore>()(
  subscribeWithSelector((set, get) => ({
    collapsed: true,
    visible: false,
    message: '',
    progress: true,
    confirm: true,
    confirmCallback: () => set({ visible: false }),
    show: (message) => {
      set({
        message,
        progress: false,
        visible: true,
        confirm: true,
        confirmCallback: () => {
          set({
            visible: false,
          })
        },
      })
    },
    setCollapsed: (collapse: boolean) => set({ collapsed: collapse }),
    toggleMenu: () => set({ collapsed: !get().collapsed }),
  }))
)
