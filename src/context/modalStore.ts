import { ParametersInvalidBeaconError } from '@airgap/beacon-core'
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
  showError: <T>(title: string, error: T) => void
  setCollapsed: (collapse: boolean) => void
  toggleMenu: () => void
  step: (title: string, message?: string, start?: boolean) => void
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
${message || ''}`,
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

    showError(title, error) {
      const show = get().show
      console.error(error)
      if (error instanceof Error) {
        show(`${title} (Error)`, error.message)
      }
      if (error instanceof ParametersInvalidBeaconError) {
        show(`${title} (${error.title})`, error.description)
      }
    },
    setCollapsed: (collapse: boolean) => set({ collapsed: collapse }),
    toggleMenu: () => set({ collapsed: !get().collapsed }),
    step: (title, message, start) => {
      if (start) {
        window.scrollTo(0, 0)
      }
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
