import { create } from 'zustand'
import {
  createJSONStorage,
  persist,
  subscribeWithSelector,
} from 'zustand/middleware'
import { useUserStore } from './userStore'
import { useModalStore } from './modalStore'
import {
  ALLOWED_FILETYPES_LABEL,
  ALLOWED_MIMETYPES,
  METADATA_ACCESSIBILITY_HAZARDS_PHOTOSENS,
  METADATA_CONTENT_RATING_MATURE,
  MIMETYPE,
  MINT_FILESIZE,
} from '@constants'
import {
  extensionFromMimetype,
  generateCoverAndThumbnail,
  getImageDimensions,
  removeExtension,
} from '@utils/mint'
import type { FileForm, Format } from '@types'
import { prepareFilesFromZIP } from '@utils/html'
import { prepareDirectory, prepareFile } from '@data/ipfs'

interface SelectField {
  label?: string
  value: string
}

interface MintState {
  title?: string
  description?: string
  tags?: string
  editions?: number
  royalties?: number
  license?: SelectField
  custom_license_uri?: string
  language?: SelectField
  nsfw: boolean
  photosensitive: boolean
  cover?: FileForm
  artifact?: FileForm
  thumbnail?: FileForm
  isValid: boolean

  reset: () => void
}

const defaultValuesStored = {
  title: '',
  description: '',
  tags: '',
  editions: undefined,
  royalties: undefined,
  license: undefined,
  custom_license_uri: '',
  language: undefined,
  nsfw: false,
  photosensitive: false,
}

const defaultValues = {
  artifact: undefined,
  cover: undefined,
  thumbnail: undefined,
  getValuesStored: () => {},
}

export const useMintStore = create<MintState>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        ...defaultValuesStored,
        ...defaultValues,
        isValid: false,
        reset: () => {
          set({ ...defaultValuesStored, ...defaultValues })
        },
        getValuesStored: () => {
          const state = get()
          return Object.fromEntries(
            Object.entries(state).filter(([key]) =>
              Object.keys(defaultValues).includes(key)
            )
          )
        },

        mint: async (ignoreUriMap: Map<string, number>) => {
          const { proxyAddress, address, sync, mint } = useUserStore.getState()
          const {
            language,
            editions,
            royalties,
            license,
            custom_license_uri,
            artifact,
            title,
            description,
            tags,
            cover,
            photosensitive,
            nsfw,
            reset,
          } = get()
          const show = useModalStore.getState().show
          const step = useModalStore.getState().step
          const close = useModalStore.getState().close

          if (!artifact || !artifact.file) {
            return
          }

          // check sync status
          if (!address) {
            step('Sync Required', 'Sync your wallet')
            await sync()
            close()
            return
          }

          // check mime type
          if (!ALLOWED_MIMETYPES.includes(artifact.mimeType)) {
            show(
              `File format invalid. supported formats include: ${ALLOWED_FILETYPES_LABEL.toLocaleLowerCase()}`
            )
            return
          }

          // check file size
          const filesize = parseInt(
            (artifact.file.size / 1024 / 1024).toFixed(4)
          )
          if (filesize > MINT_FILESIZE) {
            show(
              `Max file size (${filesize}). Limit is currently ${MINT_FILESIZE}MB`
            )
            return
          }

          // setStep(2)
          step('Mint', 'Preparing OBJKT')

          // if proxyContract is selected, using it as a the minterAddress:
          const minterAddress = proxyAddress || address

          console.debug({ minterAddress })

          // Metadata accessibility
          const accessibility = photosensitive
            ? {
                hazards: [METADATA_ACCESSIBILITY_HAZARDS_PHOTOSENS],
              }
            : null

          const contentRating = nsfw ? METADATA_CONTENT_RATING_MATURE : null

          const { imageWidth, imageHeight } = await getImageDimensions(artifact)

          const isDirectory = [
            MIMETYPE.ZIP,
            MIMETYPE.ZIP1,
            MIMETYPE.ZIP2,
          ].includes(artifact.mimeType)

          const formats = []

          const generated = await generateCoverAndThumbnail(cover || artifact)

          let used_cover = cover || generated.cover
          let used_thumb = generated.thumbnail

          if (artifact.mimeType.indexOf('image') === 0) {
            const format: Format = {
              mimeType: artifact.mimeType,
              fileSize: artifact.file.size,
              fileName: artifact.file.name,
            }
            if (imageWidth && imageHeight) {
              format.dimensions = {
                value: `${imageWidth}x${imageHeight}`,
                unit: 'px',
              }
            }
            formats.push(format)
          } else if (isDirectory) {
            formats.push({
              fileSize: artifact.file.size,
              fileName: artifact.file.name,
              mimeType: MIMETYPE.DIRECTORY,
            })
          } else {
            formats.push({
              fileSize: artifact.file.size,
              fileName: artifact.file.name,
              mimeType: artifact.mimeType,
            })
          }

          // TMP: skip GIFs to avoid making static
          if (artifact.mimeType !== MIMETYPE.GIF) {
            let coverIsGif = false
            if (used_cover) {
              coverIsGif = used_cover.mimeType === MIMETYPE.GIF
              const { imageWidth, imageHeight } = await getImageDimensions(
                used_cover
              )
              used_cover.format = {
                mimeType: used_cover.mimeType,
                fileSize: used_cover.buffer.byteLength,
                fileName: `${removeExtension(artifact.file.name)}.${
                  coverIsGif
                    ? 'gif'
                    : extensionFromMimetype(used_cover.mimeType)
                }`,
                dimensions: {
                  value: `${imageWidth}x${imageHeight}`,
                  unit: 'px',
                },
              }
            }
            if (used_thumb && !coverIsGif) {
              const { imageWidth, imageHeight } = await getImageDimensions(
                used_thumb
              )
              used_thumb.format = {
                mimeType: used_thumb.mimeType,
                fileSize: used_thumb.buffer.byteLength,
                fileName: `${removeExtension(
                  artifact.file.name
                )}.${extensionFromMimetype(used_thumb.mimeType)}`,
                dimensions: {
                  value: `${imageWidth}x${imageHeight}`,
                  unit: 'px',
                },
              }
            }
          }

          // upload file(s)
          let nftCid

          if (isDirectory) {
            const files = await prepareFilesFromZIP(artifact.buffer)

            nftCid = await prepareDirectory({
              name: title,
              description,
              tags,
              address: minterAddress,
              files,
              cover: used_cover,
              thumbnail: used_thumb,
              generateDisplayUri: true,
              rights: license?.value,
              rightUri: custom_license_uri,
              language: language?.value,
              accessibility,
              contentRating,
              formats,
            })
          } else {
            // process all other files
            nftCid = await prepareFile({
              name: title,
              description,
              tags,
              address: minterAddress,
              file: artifact,
              cover: used_cover,
              thumbnail: used_thumb,

              rights: license?.value,
              rightUri: custom_license_uri,
              language: language?.value,
              accessibility,
              contentRating,
              formats,
            })
          }

          console.debug('Calling mint with', {
            minterAddress,
            amount: editions,
            path: nftCid,
            royalties,
          })

          const success = await mint(
            minterAddress,
            editions as number,
            nftCid as string,
            royalties as number
          )
          console.debug('success', success)
          if (success) {
            reset()
          }
        },
      }),
      {
        name: 'mint',
        storage: createJSONStorage(() => localStorage), // or sessionStorage?
        onRehydrateStorage: (state) => {
          // optional
          return (state, error) => {
            if (error) {
              console.log('an error happened during hydration', error)
            }
          }
        },
        version: 1,
        partialize: (state) =>
          Object.fromEntries(
            Object.entries(state).filter(([key]) =>
              Object.keys(defaultValuesStored).includes(key)
            )
          ),
      }
    )
  )
)
