import { create } from 'zustand'
import {
  createJSONStorage,
  persist,
  subscribeWithSelector,
} from 'zustand/middleware'

export interface CopyrightStore {
  customLicenseData?: any

  setCustomLicenseData: (data: any) => void
  reset: () => void
}

export const useCopyrightStore = create<CopyrightStore>()(
  subscribeWithSelector(
    persist(
      (set) => ({
        customLicenseData: undefined,

        setCustomLicenseData: (data) => {
          set({ customLicenseData: data })
        },

        reset: () => {
          set({ customLicenseData: undefined })
        },
      }),
      {
        name: 'mint-copyright',
        storage: createJSONStorage(() => localStorage),
      }
    )
  )
)
