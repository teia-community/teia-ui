import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'

// interface ModalOptions {
//   visible?: boolean
//   message?: string
//   progress?: boolean
//   confirm?: boolean
//   confirmCallback?: () => void
// }
interface ModalStore {
  /** main menu collapsed state */
  collapsed: boolean
  visible: boolean
  message: string
  progress: boolean
  confirm: boolean
  confirmCallback?: () => void
  show: (title: string, message?: string) => void
  setCollapsed: (collapse: boolean) => void
  toggleMenu: () => void
  step: (title: string, message?: string) => void
  close: () => void
}

export const useModalStore = create<ModalStore>()(
  subscribeWithSelector((set, get) => ({
    collapsed: true,
    visible: false,
    message: '',
    progress: false,
    confirm: true,
    confirmCallback: () => get().close(),
    show: (title, message) => {
      set({
        message: `# ${title}
${message}`,
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
    step: (title, message) => {
      set({
        progress: true,
        visible: true,
        confirm: false,
        message: `# ${title}
${message}`,
      })
    },

    close: () => {
      set({
        visible: false,
        progress: false,
      })
    },
  }))
)
