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
  /** When true, the modal shows Confirm + Cancel instead of just Close. */
  asking: boolean
  askResolve?: (value: boolean) => void
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
  /** Show a confirmation dialog. Resolves true if confirmed, false if cancelled. */
  ask: (title: string, message?: string) => Promise<boolean>
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
    asking: false,
    askResolve: undefined,
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
      if (error instanceof ParametersInvalidBeaconError) {
        show(`${title} (${error.title})`, error.description)
      } else if (error instanceof Error) {
        show(`${title} (Error)`, error.message)
      } else {
        // Fallback: Beacon errors (e.g. AbortedBeaconError from a user-rejected
        // wallet prompt) extend BeaconError, which does NOT extend Error, so
        // neither branch above matches. Without this, showError would leave the
        // progress modal stranded with no way to dismiss it.
        const beaconError = error as { title?: string; description?: string }
        show(
          `${title} (${beaconError?.title ?? 'Error'})`,
          beaconError?.description ??
            (error == null ? 'Something went wrong.' : String(error))
        )
      }
    },
    ask: (title, message) => {
      return new Promise<boolean>((resolve) => {
        set({
          message: `# ${title}\n${message || ''}`,
          progress: false,
          visible: true,
          confirm: false,
          asking: true,
          askResolve: resolve,
          footerSlot: undefined,
          onCloseExtras: undefined,
        })
      })
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
      const { askResolve } = get()
      if (askResolve) askResolve(false)
      set({
        visible: false,
        progress: false,
        asking: false,
        askResolve: undefined,
        footerSlot: undefined,
        onCloseExtras: undefined,
      })
    },
  }))
)
