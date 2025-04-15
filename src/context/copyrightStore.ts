import { create } from 'zustand';
import {
  createJSONStorage,
  persist,
  subscribeWithSelector,
} from 'zustand/middleware';
import { char2Bytes } from '@taquito/utils';
import { Tezos, useUserStore } from './userStore';
import { useModalStore } from './modalStore';
import { COPYRIGHT_CONTRACT } from '../constants';

export interface CopyrightStore {
  customLicenseData?: any;
  setCustomLicenseData: (data: any) => void;
  reset: () => void;
}

export const useCopyrightStore = create<CopyrightStore>()(
  subscribeWithSelector(
    persist(
      (set) => ({
        customLicenseData: undefined,

        setCustomLicenseData: (data) => {
          set({ customLicenseData: data });
        },

        reset: () => {
          set({ customLicenseData: undefined });
        },
              
        submitCopyrightAgreement: async (): Promise<string | undefined> => {
          const handleOp = useUserStore.getState().handleOp
          const showError = useModalStore.getState().showError
          const step = useModalStore.getState().step
          const { customLicenseData } = useCopyrightStore.getState()
        
          const modalTitle = 'Submit Copyright Agreement'
          step(modalTitle, 'Waiting for confirmation', true)
        
          try {
            const contract = await Tezos.wallet.at(COPYRIGHT_CONTRACT)
        
            const op = await contract.methodsObject.create_copyright({
              tokens: customLicenseData.tokens.map(t => ({
                contract_address: t.contractAddress,
                token_id: parseInt(t.tokenId),
              })),
              document_text: char2Bytes(customLicenseData.documentText),
              clauses: customLicenseData.clauses,
            }).send()
        
            const opHash = await handleOp(op, modalTitle)
            return opHash
          } catch (err) {
            showError(modalTitle, err)
          }
        },
      }),
      {
        name: 'mint-copyright',
        storage: createJSONStorage(() => localStorage),
      }
    )
  )
);