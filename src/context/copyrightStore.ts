import { create } from 'zustand';
import {
  createJSONStorage,
  persist,
  subscribeWithSelector,
} from 'zustand/middleware';
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
          const showError = useModalStore.getState().showError
          const step = useModalStore.getState().step
          const show = useModalStore.getState().show
          const { customLicenseData } = useCopyrightStore.getState()

          const modalTitle = 'Submit Copyright Agreement'
          step(modalTitle, 'Waiting for confirmation', true)

          try {
            const tokenCreators = (customLicenseData.tokens || [])
              .flatMap((t: { metadata?: { creators?: string[] } }) => t.metadata?.creators || [])

            const creators = Array.from(new Set([
              useUserStore.getState().address,
              ...tokenCreators
            ]))
            try {
              const contract = await Tezos.wallet.at(COPYRIGHT_CONTRACT)
              const firstParagraph = customLicenseData.documentText.includes('This Agreement outlines the')
                ? customLicenseData.documentText.split('This Agreement outlines the')[0].trim()
                : customLicenseData.documentText.slice(0, 530).trim()

              console.log('firstParagraph', firstParagraph)
              const handleOp = useUserStore.getState().handleOp
              const opHash = await handleOp(
                contract.methodsObject.create_copyright({
                  clauses: {
                    addendum: customLicenseData.clauses.addendum || null,
                    broadcast: customLicenseData.clauses.broadcast,
                    createDerivativeWorks: customLicenseData.clauses.createDerivativeWorks,
                    customUri: customLicenseData.clauses.customUri || null,
                    customUriEnabled: customLicenseData.clauses.customUriEnabled,
                    exclusiveRights: customLicenseData.clauses.exclusiveRights || null,
                    expirationDate: customLicenseData.clauses.expirationDate || null,
                    expirationDateExists: customLicenseData.clauses.expirationDateExists,
                    firstParagraph: firstParagraph || '',
                    publicDisplay: customLicenseData.clauses.publicDisplay,
                    releasePublicDomain: customLicenseData.clauses.releasePublicDomain,
                    reproduce: customLicenseData.clauses.reproduce,
                    requireAttribution: customLicenseData.clauses.requireAttribution,
                    retainCreatorRights: customLicenseData.clauses.retainCreatorRights,
                    rightsAreTransferable: customLicenseData.clauses.rightsAreTransferable,
                  },
                  creators: Array.from(creators),
                  related_tezos_nfts: customLicenseData.tokens
                    .filter((t: { contractAddress: string }) => t.contractAddress !== 'external')
                    .map((t: { contractAddress: string; tokenId: string }) => ({
                      contract: t.contractAddress,
                      token_id: parseInt(t.tokenId),
                    })),
                  related_external_nfts: customLicenseData.tokens
                    .filter((t: { contractAddress: string }) => t.contractAddress === 'external')
                    .map((t: { metadata: { name: string } }) => t.metadata.name),
                }),
                modalTitle,
                { amount: 0.1 }
              )

              console.log('[DEBUG] Operation sent:', opHash)
              show(modalTitle, `Copyright submitted https://tzkt.io/${opHash}`)
              return opHash
            } catch (err: unknown) {
              console.error('[ERROR]', err)
              showError('Submit Copyright Agreement', err)
            }

          } catch (err: unknown) {
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