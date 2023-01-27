import React, { useContext, useEffect, useState } from 'react'
import ipfsHash from 'ipfs-only-hash'
import _ from 'lodash'
import { TeiaContext } from '@context/TeiaContext'
import { Page } from '@atoms/layout'
import { Input, Textarea, Checkbox } from '@atoms/input'
import Select from '@atoms/select'
import { Button, Primary } from '@atoms/button'
import { Upload } from '@components/upload'
import { Preview } from '@components/preview'
import { prepareFile, prepareDirectory } from '@data/ipfs'
import { prepareFilesFromZIP } from '@utils/html'
import {
  ALLOWED_MIMETYPES,
  ALLOWED_FILETYPES_LABEL,
  ALLOWED_COVER_MIMETYPES,
  ALLOWED_COVER_FILETYPES_LABEL,
  MINT_FILESIZE,
  MIMETYPE,
  MAX_EDITIONS,
  MIN_ROYALTIES,
  MAX_ROYALTIES,
  COVER_COMPRESSOR_OPTIONS,
  THUMBNAIL_COMPRESSOR_OPTIONS,
  LICENSE_TYPES_OPTIONS,
  LANGUAGES_OPTIONS,
  METADATA_CONTENT_RATING_MATURE,
} from '@constants'
import {
  fetchGraphQL,
  getCollabsForAddress,
  getNameForAddress,
} from '@data/api'
import collabStyles from '@components/collab/index.module.scss'
import classNames from 'classnames'
import { CollabContractsOverview } from '../collaborate/index'
import styles from '@style'
import useSettings from 'hooks/use-settings'
import {
  extensionFromMimetype,
  generateCompressedImage,
  getImageDimensions,
  removeExtension,
} from '@utils/mint'
import { Line } from '@atoms/line'

const uriQuery = `query uriQuery($address: String!, $ids: [String!] = "") {
  tokens(order_by: {minted_at: desc}, where: {metadata_status: { _eq: "processed" }, artifact_uri: {_in: $ids}, artist_address: {_eq: $address}}) {
    artist_address
    editions
  }
}`

const GENERATE_DISPLAY_AND_THUMBNAIL = true

export const Mint = () => {
  const {
    mint,
    acc,
    setAccount,
    getBalance,
    proxyAddress,
    setFeedback,
    showFeedback,
    syncTaquito,
  } = useContext(TeiaContext)

  const { ignoreUriMap } = useSettings()

  const [balance, setBalance] = useState(-1.0)
  const [step, setStep] = useState(0)
  const [title, setTitle] = useState()
  const [mintName, setMintName] = useState('')
  const [description, setDescription] = useState()
  const [tags, setTags] = useState()
  const [amount, setAmount] = useState()
  const [royalties, setRoyalties] = useState()
  /** @type {import("@types").useState<import("@types").FileMint>} */
  const [file, setFile] = useState() // the uploaded file
  const [cover, setCover] = useState() // the uploaded or generated cover image
  const [thumbnail, setThumbnail] = useState() // the uploaded or generated cover image
  const [needsCover, setNeedsCover] = useState(false)
  const [collabs, setCollabs] = useState([])
  const [selectCollab, setSelectCollab] = useState(false)
  const [rights, setRights] = useState('') // To allow the artist to specify the asset rights.
  const [rightUri, setRightUri] = useState() // A URI to a statement of rights.
  const [language, setLanguage] = useState() // The language of the intellectual content of the asset.
  const [nsfw, setNsfw] = useState(false) // Not Safe For Work flag
  const [photosensitiveSeizureWarning, setPhotosensitiveSeizureWarning] =
    useState(false) // Photosensitivity flag

  // On mount, see if there are available collab contracts
  useEffect(() => {
    // On boot, see what addresses the synced address can manage
    fetchGraphQL(getCollabsForAddress, 'GetCollabs', {
      address: acc?.address,
    }).then(({ data, errors }) => {
      if (data) {
        // const shareholderInfo = data.shareholder.map(s => s.split_contract);
        // setCollabs(shareholderInfo || [])
        const managedCollabs = data.split_contracts
        setCollabs(managedCollabs || [])
      }
    })
    if (acc && hasStoredFields()) restoreFields()
    if (acc?.address) {
      getBalance(acc.address).then((bal) => {
        setBalance(bal)
      })
    }
    updateName()
  }, [acc]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    updateName()
    setSelectCollab(false)
  }, [proxyAddress]) // eslint-disable-line react-hooks/exhaustive-deps

  /** Resolves the minter name */
  const updateName = () => {
    const currentAddress = proxyAddress || acc?.address

    fetchGraphQL(getNameForAddress, 'GetNameForAddress', {
      address: currentAddress,
    }).then(({ data, errors }) => {
      if (data) {
        // TODO: test if this works
        setMintName(_.get(data, 'teia_users.0.name') || currentAddress)
      }
    })
  }

  const handleMint = async () => {
    // check sync status
    if (!acc) {
      setFeedback({
        visible: true,
        message: 'Sync your wallet',
        progress: true,
        confirm: false,
      })

      await syncTaquito()

      setFeedback({
        visible: false,
      })
      return
    }
    await setAccount()

    // check mime type
    if (!ALLOWED_MIMETYPES.includes(file.mimeType)) {
      showFeedback(
        `File format invalid. supported formats include: ${ALLOWED_FILETYPES_LABEL.toLocaleLowerCase()}`
      )
      return
    }

    // check file size
    const filesize = (file.file.size / 1024 / 1024).toFixed(4)
    if (filesize > MINT_FILESIZE) {
      showFeedback(
        `Max file size (${filesize}). Limit is currently ${MINT_FILESIZE}MB`
      )
      return
    }

    setStep(2)

    setFeedback({
      visible: true,
      message: 'Preparing OBJKT',
      progress: true,
      confirm: false,
    })

    // if proxyContract is selected, using it as a the minterAddress:
    const minterAddress = proxyAddress || acc.address
    // ztepler: I have not understand the difference between acc.address and getAuth here
    //    so I am using acc.address (minterAddress) in both nftCid.address and in mint call

    console.debug({ minterAddress })

    // Metadata accessibility
    const accessibility = photosensitiveSeizureWarning
      ? {
          hazards: ['flashing'],
        }
      : null

    const contentRating = nsfw ? METADATA_CONTENT_RATING_MATURE : null

    const { imageWidth, imageHeight } = await getImageDimensions(file)

    const isDirectory = [MIMETYPE.ZIP, MIMETYPE.ZIP1, MIMETYPE.ZIP2].includes(
      file.mimeType
    )
    const formats = []
    if (file.mimeType.indexOf('image') === 0) {
      const format = {
        mimeType: file.mimeType,
        fileSize: file.file.size,
        fileName: file.file.name,
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
        fileSize: file.file.size,
        fileName: file.file.name,
        mimeType: MIMETYPE.DIRECTORY,
      })
    } else {
      formats.push({
        fileSize: file.file.size,
        fileName: file.file.name,
        mimeType: file.mimeType,
      })
    }

    // TMP: skip GIFs to avoid making static
    if (file.mimeType !== MIMETYPE.GIF) {
      let coverIsGif = false
      if (cover) {
        coverIsGif = cover.mimeType === MIMETYPE.GIF
        const { imageWidth, imageHeight } = await getImageDimensions(cover)
        cover.format = {
          mimeType: cover.mimeType,
          fileSize: cover.buffer.byteLength,
          fileName: `${removeExtension(file.file.name)}.${
            coverIsGif ? 'gif' : extensionFromMimetype(cover.mimeType)
          }`,
          dimensions: {
            value: `${imageWidth}x${imageHeight}`,
            unit: 'px',
          },
        }
      }
      if (thumbnail && !coverIsGif) {
        const { imageWidth, imageHeight } = await getImageDimensions(thumbnail)
        thumbnail.format = {
          mimeType: thumbnail.mimeType,
          fileSize: thumbnail.buffer.byteLength,
          fileName: `${removeExtension(file.file.name)}.${extensionFromMimetype(
            thumbnail.mimeType
          )}`,
          dimensions: {
            value: `${imageWidth}x${imageHeight}`,
            unit: 'px',
          },
        }
      }
    }

    // upload file(s)
    let nftCid
    try {
      if (isDirectory) {
        const files = await prepareFilesFromZIP(file.buffer)

        nftCid = await prepareDirectory({
          name: title,
          description,
          tags,
          address: minterAddress,
          files,
          cover,
          thumbnail,
          generateDisplayUri: GENERATE_DISPLAY_AND_THUMBNAIL,
          rights: rights.value,
          rightUri,
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
          file,
          cover,
          thumbnail,
          generateDisplayUri: GENERATE_DISPLAY_AND_THUMBNAIL,
          rights: rights.value,
          rightUri,
          language: language?.value,
          accessibility,
          contentRating,
          formats,
        })
      }

      console.debug('Calling mint with', {
        minterAddress,
        amount,
        path: nftCid,
        royalties,
      })
      const success = await mint(minterAddress, amount, nftCid, royalties)
      console.debug('success', success)
      if (success) {
        clearFields(true)
      }
      setStep(0)
    } catch (e) {
      showFeedback(`Can't mint: ${e}`)
      setStep(0)
    }
  }

  /** Check the user account minted CIDs against the current one. */
  const isDoubleMint = async () => {
    const rawLeaves = false
    const hashv0 = await ipfsHash.of(file.buffer, { cidVersion: 0, rawLeaves })
    const hashv1 = await ipfsHash.of(file.buffer, { cidVersion: 1, rawLeaves })
    console.debug(`Current CIDv0: ${hashv0}`)
    console.debug(`Current CIDv1: ${hashv1}`)

    const uri0 = `ipfs://${hashv0}`
    const uri1 = `ipfs://${hashv1}`

    // Ignore IPFS URI's that are in the ignore list; they can be minted multiple times

    if (ignoreUriMap.get(uri0) === 1 || ignoreUriMap.get(uri1) === 1) {
      return false
    }

    // TODO: test if this still works correctly
    const { errors, data } = await fetchGraphQL(uriQuery, 'uriQuery', {
      address: proxyAddress || acc.address,
      ids: [uri0, uri1],
    })

    if (errors) {
      showFeedback(`GraphQL Error: ${JSON.stringify(errors)}`)
      return true
    } else if (data) {
      const areAllTokensBurned = (data.tokens || []).every(
        ({ editions }) => editions === 0
      )

      if (areAllTokensBurned) {
        return false
      }

      showFeedback(
        `Duplicate mint detected: #${data.token[0].id} is already minted`
      )

      return true
    }

    return false
  }

  /** Detect user double mints and proceed to the preview page */
  const handlePreview = async () => {
    if (!(await isDoubleMint())) {
      setStep(1)
    }
  }

  const handleFileUpload = async (props) => {
    setFile(props)

    if (GENERATE_DISPLAY_AND_THUMBNAIL) {
      if (props.mimeType.indexOf('image') === 0) {
        setNeedsCover(false)
        await generateCoverAndThumbnail(props)
      } else {
        setNeedsCover(true)
      }
    }
  }

  const generateCoverAndThumbnail = async (props) => {
    // TMP: skip GIFs to avoid making static
    if (props.mimeType === MIMETYPE.GIF) {
      setCover(props)
      setThumbnail(props)
      return
    }

    const cover = await generateCompressedImage(props, COVER_COMPRESSOR_OPTIONS)
    setCover(cover)

    const thumb = await generateCompressedImage(
      props,
      THUMBNAIL_COMPRESSOR_OPTIONS
    )
    setThumbnail(thumb)
  }

  const limitNumericField = async (target, minValue, maxValue) => {
    if (target.value === '') target.value = '' // Seems redundant but actually cleans up e.g. '234e'
    target.value = Math.round(
      Math.max(Math.min(target.value, maxValue), minValue)
    )
  }

  const handleRightsValidation = () => {
    const urlR =
      '^(http|ipf)s?://(?:www.)?([-a-zA-Z0-9@:%._+~#=]{1,256}.?[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_+.~#?&/=]*))?'
    if (rights && rights.value === 'custom') {
      if (rightUri?.match(urlR)) {
        return true
      }
      return false
    } else {
      return true
    }
  }
  const handleValidation = () => {
    if (
      amount == null ||
      amount <= 0 ||
      amount > MAX_EDITIONS ||
      royalties == null ||
      royalties < MIN_ROYALTIES ||
      royalties > MAX_ROYALTIES ||
      !handleRightsValidation() ||
      !file
    ) {
      return true
    }
    if (GENERATE_DISPLAY_AND_THUMBNAIL) {
      if (cover && thumbnail) {
        return false
      }
    } else {
      return false
    }
    return true
  }

  const mintKeys = [
    'objkt::title',
    'objkt::description',
    'objkt::tags',
    'objkt::edition_count',
    'objkt::royalties',
    'objkt::rights',
    'objkt::rights_uri',
    'objkt::language',
    'objkt::nsfw',
    'objkt::photosensitive_seizure_warning',
  ]

  const restoreFields = () => {
    try {
      const title = window.localStorage.getItem('objkt::title') || ''
      const description =
        window.localStorage.getItem('objkt::description') || ''
      const tags = window.localStorage.getItem('objkt::tags') || ''
      const edition_count =
        window.localStorage.getItem('objkt::edition_count') || undefined
      const royalties =
        window.localStorage.getItem('objkt::royalties') || undefined
      let rights = window.localStorage.getItem('objkt::rights') || undefined
      rights = rights ? JSON.parse(rights) : 'null'
      const rights_uri = window.localStorage.getItem('objkt::rights_uri') || ''
      let language = window.localStorage.getItem('objkt::language')
      language = language ? JSON.parse(language) : 'null'
      const nsfw = window.localStorage.getItem('objkt::nsfw') === 'true'
      const photoSeizureWarning =
        window.localStorage.getItem('objkt::photosensitive_seizure_warning') ===
        'true'

      console.debug('Restoring fields from localStorage', {
        title,
        description,
        tags,
        edition_count,
        royalties,
        rights,
        rights_uri,
        language,
        nsfw,
        photoSeizureWarning,
      })

      setTitle(title)
      setDescription(description)
      setTags(tags)
      setAmount(edition_count)
      setRoyalties(royalties)

      setRights(rights)
      setRightUri(rights_uri)
      setLanguage(language)
      setNsfw(nsfw)
      setPhotosensitiveSeizureWarning(photoSeizureWarning)
    } catch (e) {
      console.warn(
        'Something went wrong while restoring mint fields, skipping and deleting fields in localStorage'
      )
      console.groupCollapsed('expand for details')
      console.error(e)
      console.groupEnd()
      clearFields(true)
    }
  }

  const clearFields = (full = false) => {
    setTitle('')
    setDescription('')
    setTags('')
    setAmount('')
    setRoyalties('')
    setRights('')
    setRightUri('')
    setNsfw(false)
    setPhotosensitiveSeizureWarning(false)
    setLanguage('')

    if (full) {
      setCover(null)
      setFile(null)
    }

    mintKeys.forEach((k) => window.localStorage.removeItem(k))
  }

  const hasStoredFields = () => {
    for (const key of mintKeys) {
      if (window.localStorage.getItem(key)) {
        return true
      }
    }
    return false
  }

  // const proxyDisplay = proxyName || proxyAddress
  // const mintingAs = proxyDisplay || (acc?.name || acc?.address)
  const flexBetween = classNames(collabStyles.flex, collabStyles.flexBetween)

  return (
    <Page title="Mint" large>
      <div className={styles.mint_form} data-form-type="other">
        {step === 0 && (
          <>
            {/* User has collabs available */}
            {collabs.length > 0 && (
              <div className={flexBetween}>
                <p>
                  <span style={{ opacity: 0.5 }}>minting as</span> {mintName}
                </p>
                <Button
                  shadow_box
                  onClick={() => setSelectCollab(!selectCollab)}
                >
                  {selectCollab ? 'Cancel' : 'Change'}
                </Button>
              </div>
            )}

            {selectCollab && <CollabContractsOverview showAdminOnly />}

            {balance > 0 && balance < 0.15 && (
              <div className={styles.fundsWarning}>
                <p>
                  {`⚠️ You seem to be low on funds (${balance}ꜩ), mint will probably fail...`}
                </p>
              </div>
            )}

            <Input
              type="text"
              onChange={(e) => {
                setTitle(e.target.value)
                window.localStorage.setItem('objkt::title', e.target.value)
              }}
              placeholder="Max 500 characters (optional)"
              label="Title"
              value={title}
            >
              <Line />
            </Input>

            <Textarea
              type="text"
              style={{ whiteSpace: 'pre' }}
              onChange={(e) => {
                setDescription(e.target.value)
                window.localStorage.setItem(
                  'objkt::description',
                  e.target.value
                )
              }}
              placeholder="Max 5000 characters (optional)"
              label="Description"
              value={description}
            >
              <Line />
            </Textarea>

            <Input
              type="text"
              onChange={(e) => {
                setTags(e.target.value)
                window.localStorage.setItem('objkt::tags', e.target.value)
              }}
              onBlur={(e) => {
                const tags = _.join(
                  _.uniq(e.target.value.split(',').map((tag) => tag.trim())),
                  ','
                )
                setTags(tags)
                window.localStorage.setItem('objkt::tags', tags)
              }}
              placeholder="Comma separated. example: illustration, digital (optional)"
              label="Tags"
              value={tags}
            >
              <Line />
            </Input>
            <Input
              type="number"
              min={1}
              max={MAX_EDITIONS}
              onChange={(e) => {
                setAmount(e.target.value)
                window.localStorage.setItem(
                  'objkt::edition_count',
                  e.target.value
                )
              }}
              onBlur={(e) => {
                limitNumericField(e.target, 1, MAX_EDITIONS)
                setAmount(e.target.value)
              }}
              placeholder={`No. editions, 1-${MAX_EDITIONS}`}
              label="Editions"
              value={amount}
            >
              <Line />
            </Input>

            <Input
              type="number"
              min={MIN_ROYALTIES}
              max={MAX_ROYALTIES}
              onChange={(e) => {
                setRoyalties(e.target.value)
                window.localStorage.setItem('objkt::royalties', e.target.value)
              }}
              onBlur={(e) => {
                limitNumericField(e.target, MIN_ROYALTIES, MAX_ROYALTIES)
                setRoyalties(e.target.value)
              }}
              placeholder={`After each sale (between ${MIN_ROYALTIES}-${MAX_ROYALTIES}%)`}
              label="Royalties"
              value={royalties}
            >
              <Line />
            </Input>
            <Select
              label="License"
              value={rights}
              placeholder="(optional)"
              onChange={(e) => {
                setRights(e)
                window.localStorage.setItem('objkt::rights', JSON.stringify(e))
              }}
              options={LICENSE_TYPES_OPTIONS}
            />

            {rights.value === 'custom' && (
              <Input
                type="text"
                onChange={(e) => {
                  setRightUri(e.target.value)
                  window.localStorage.setItem(
                    'objkt::rights_uri',
                    e.target.value
                  )
                }}
                placeholder="The URI to the custom license"
                label="Custom license URI"
                value={rightUri}
              />
            )}
            <Line />
            <Select
              label="Language"
              placeholder="(optional)"
              options={LANGUAGES_OPTIONS}
              value={language}
              onChange={(e) => {
                setLanguage(e)
                window.localStorage.setItem(
                  'objkt::language',
                  JSON.stringify(e)
                )
              }}
            >
              <Line />
            </Select>
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-start',
                paddingTop: '30px',
              }}
            >
              <Checkbox
                label="NSFW"
                checked={nsfw}
                onChange={(e) => {
                  setNsfw(e.target.checked)
                  window.localStorage.setItem(
                    'objkt::nsfw',
                    e.target.checked ? 'true' : 'false'
                  )
                }}
                name="nsfw"
              />
              <Checkbox
                checked={photosensitiveSeizureWarning}
                onChange={(e) => {
                  setPhotosensitiveSeizureWarning(e.target.checked)
                  window.localStorage.setItem(
                    'objkt::photosensitive_seizure_warning',
                    e.target.checked ? 'true' : 'false'
                  )
                }}
                name="photosens"
                label="Photo Sensitive Seizure Warning"
              />
            </div>
            <span className="horizontal-line" />
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button onClick={clearFields} fit>
                <Primary>Clear Fields</Primary>
              </Button>
            </div>

            <Upload
              label="Upload OBJKT"
              allowedTypesLabel={ALLOWED_FILETYPES_LABEL}
              onChange={handleFileUpload}
            />

            {file && needsCover && (
              <Upload
                label="Upload cover image"
                allowedTypes={ALLOWED_COVER_MIMETYPES}
                allowedTypesLabel={ALLOWED_COVER_FILETYPES_LABEL}
                onChange={generateCoverAndThumbnail}
              />
            )}

            <Button
              shadow_box
              onClick={handlePreview}
              fit
              disabled={handleValidation()}
            >
              Preview
            </Button>
          </>
        )}

        {step === 1 && (
          <>
            <div style={{ display: 'flex' }}>
              <Button onClick={() => setStep(0)} fit>
                <Primary>
                  <strong>Back</strong>
                </Primary>
              </Button>
            </div>

            <Preview
              mimeType={file.mimeType}
              previewUri={file.reader}
              previewDisplayUri={cover.reader}
              title={title}
              description={description}
              tags={tags}
              rights={rights}
              rightUri={rightUri}
              language={language}
              nsfw={nsfw}
              photosensitiveSeizureWarning={photosensitiveSeizureWarning}
              amount={amount}
              royalties={royalties}
            />

            <Button shadow_box onClick={handleMint} fit>
              Mint OBJKT
            </Button>

            <p>this operation costs 0.08~ tez</p>
            <p>Your royalties upon each sale are {royalties}%</p>
          </>
        )}

        <Button href="https://github.com/teia-community/teia-docs/wiki/Core-Values-Code-of-Conduct-Terms-and-Conditions">
          <Primary>Terms & Conditions</Primary>
        </Button>
        <hr />
      </div>
    </Page>
  )
}