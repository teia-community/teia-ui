import { ParametersInvalidBeaconError } from '@ecadlabs/beacon-core'
import type { ReactNode } from 'react'
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
  /** Optional React content below markdown (e.g. post-mint inline swap). */
  footerSlot?: ReactNode
  /** Runs once when the user closes a modal that had footerSlot / extras. */
  onCloseExtras?: () => void
  show: (
    title: string,
    message?: string,
    options?: { footerSlot?: ReactNode; onCloseExtras?: () => void }
  ) => void
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
    show: (title, message, options) => {
      const footerSlot = options?.footerSlot
      const onCloseExtras = options?.onCloseExtras
      set({
        message: `# ${title}
${message || ''}`,
        progress: false,
        visible: true,
        confirm: true,
        footerSlot,
        onCloseExtras,
        confirmCallback: () => {
          const extras = get().onCloseExtras
          extras?.()
          set({
            visible: false,
            footerSlot: undefined,
            onCloseExtras: undefined,
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
        footerSlot: undefined,
        onCloseExtras: undefined,
        message: `# ${title}
${message}`,
      })
    },

    close: () => {
      set({
        visible: false,
        progress: false,
        footerSlot: undefined,
        onCloseExtras: undefined,
      })
    },
  }))
)
