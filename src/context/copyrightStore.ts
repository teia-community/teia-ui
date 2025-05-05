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
            const allCreators = new Set<string>()

            try {
              const contract = await Tezos.wallet.at(COPYRIGHT_CONTRACT)
            
              const op = await contract.methodsObject.create_copyright({
                clauses: {
                  addendum: customLicenseData.clauses.addendum || null,
                  broadcast: customLicenseData.clauses.broadcast,
                  createDerivativeWorks: customLicenseData.clauses.createDerivativeWorks,
                  customUri: customLicenseData.clauses.customUri || null,
                  customUriEnabled: customLicenseData.clauses.customUriEnabled,
                  exclusiveRights: customLicenseData.clauses.exclusiveRights || null,
                  expirationDate: customLicenseData.clauses.expirationDate || null,
                  expirationDateExists: customLicenseData.clauses.expirationDateExists,
                  firstParagraph: customLicenseData.documentText?.slice(0, 500) || '',
                  publicDisplay: customLicenseData.clauses.publicDisplay,
                  releasePublicDomain: customLicenseData.clauses.releasePublicDomain,
                  reproduce: customLicenseData.clauses.reproduce,
                  requireAttribution: customLicenseData.clauses.requireAttribution,
                  retainCreatorRights: customLicenseData.clauses.retainCreatorRights,
                  rightsAreTransferable: customLicenseData.clauses.rightsAreTransferable,
                },
                creators: Array.from(allCreators),
                related_tezos_nfts: customLicenseData.tokens
                  .filter(t => t.contractAddress !== 'external')
                  .map(t => ({
                    contract: t.contractAddress,
                    token_id: parseInt(t.tokenId),
                  })),
                related_external_nfts: customLicenseData.tokens
                  .filter(t => t.contractAddress === 'external')
                  .map(t => t.metadata.name),
              }).send()
            
              console.log('[DEBUG] Operation sent:', op.opHash)
              const opHash = await handleOp(op, 'Submit Copyright')
              return opHash
            } catch (err) {
              console.error('[ERROR]', err)
              showError('Submit Copyright Agreement', err)
            }

          } catch (err) {
            showError(modalTitle, err)
          }
        }        
      }),
      {
        name: 'mint-copyright',
        storage: createJSONStorage(() => localStorage),
      }
    )
  )
);