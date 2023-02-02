import React, { useContext, useEffect, useState } from 'react'
import ipfsHash from 'ipfs-only-hash'
import _ from 'lodash'
import { TeiaContext } from '@context/TeiaContext'
import { Page } from '@atoms/layout'
import { Input, Textarea, Checkbox } from '@atoms/input'
import Select from '@atoms/select'
import { Button } from '@atoms/button'
import { Upload } from '@components/upload'
import { Preview } from '@components/preview'
import { prepareFile, prepareDirectory } from '@data/ipfs'
import { prepareFilesFromZIP } from '@utils/html'
import { useLocalStorage } from 'react-use'
import {
  ALLOWED_COVER_FILETYPES_LABEL,
  ALLOWED_COVER_MIMETYPES,
  ALLOWED_FILETYPES_LABEL,
  ALLOWED_MIMETYPES,
  COVER_COMPRESSOR_OPTIONS,
  LANGUAGES_OPTIONS,
  LICENSE_TYPES_OPTIONS,
  MAX_EDITIONS,
  MAX_ROYALTIES,
  METADATA_ACCESSIBILITY_HAZARDS_PHOTOSENS,
  METADATA_CONTENT_RATING_MATURE,
  MIMETYPE,
  MIN_ROYALTIES,
  MINT_FILESIZE,
  THUMBNAIL_COMPRESSOR_OPTIONS,
} from '@constants'
import {
  fetchGraphQL,
  getCollabsForAddress,
  getNameForAddress,
} from '@data/api'
import collabStyles from '@components/collab/index.module.scss'
import classNames from 'classnames'
import { CollabContractsOverview } from '../collaborate'
import styles from '@style'
import useSettings from 'hooks/use-settings'
import {
  extensionFromMimetype,
  generateCompressedImage,
  getImageDimensions,
  removeExtension,
} from '@utils/mint'
import { Line as CoreLine } from '@atoms/line'

const uriQuery = `query uriQuery($address: String!, $ids: [String!] = "") {
  tokens(order_by: {minted_at: desc}, where: {metadata_status: { _eq: "processed" }, artifact_uri: {_in: $ids}, artist_address: {_eq: $address}}) {
    artist_address
    editions
  }
}`

const GENERATE_DISPLAY_AND_THUMBNAIL = true

const Line = () => <CoreLine className={styles.line} />

export const Mint = () => {
  const {
    acc,
    getBalance,
    mint,
    proxyAddress,
    setAccount,
    setFeedback,
    showFeedback,
    syncTaquito,
  } = useContext(TeiaContext)

  const { ignoreUriMap } = useSettings()

  /*states*/
  const [balance, setBalance] = useState(-1.0)
  const [step, setStep] = useState(0)
  const [mintName, setMintName] = useState('')
  const [needsCover, setNeedsCover] = useState(false)

  const [collabs, setCollabs] = useState([])
  const [selectCollab, setSelectCollab] = useState(false)

  const [file, setFile] = useState() // the uploaded file
  const [cover, setCover] = useState() // the uploaded or generated cover image

  /*form*/
  const [title, setTitle] = useLocalStorage('objkt:title', '')
  const [description, setDescription] = useLocalStorage('objkt:description', '')
  const [tags, setTags] = useLocalStorage('objkt:tags', '')
  const [amount, setAmount] = useLocalStorage('objkt:amount', 0)
  const [royalties, setRoyalties] = useLocalStorage('objkt:royalties')

  /** @type {import("@types").useState<import("@types").FileMint>} */
  const [thumbnail, setThumbnail] = useLocalStorage('objkt:thumbnail') // the uploaded or generated cover image
  const [rights, setRights] = useLocalStorage('objkt:rights', '') // To allow the artist to specify the asset rights.
  const [rightUri, setRightUri] = useLocalStorage('objkt:right_uri', '') // A URI to a statement of rights.
  const [language, setLanguage] = useLocalStorage('objkt:language', '') // The language of the intellectual content of the asset.
  const [nsfw, setNsfw] = useLocalStorage('objkt:nsfw', false) // Not Safe For Work flag
  const [photosensitiveSeizureWarning, setPhotosensitiveSeizureWarning] =
    useLocalStorage('objkt:photosensitiveSeizureWarning', false) // Photosensitivity flag

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
    // if (acc && hasStoredFields()) restoreFields()
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
          hazards: [METADATA_ACCESSIBILITY_HAZARDS_PHOTOSENS],
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
    if (props.mimeType.indexOf('image') === 0) {
      setNeedsCover(false)
      await generateCoverAndThumbnail(props)
      setFile(props)
    } else {
      setFile(props)
      setNeedsCover(true)
    }
  }

  const generateCoverAndThumbnail = async (props) => {
    // TMP: skip GIFs to avoid making static
    if (props.mimeType === MIMETYPE.GIF) {
      setCover(props)
      setThumbnail(props)
      return
    }
    console.debug('Generating cover')
    const cover = await generateCompressedImage(props, COVER_COMPRESSOR_OPTIONS)
    setCover(cover)
    console.debug('Generating thumbnail')
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
      parseInt(amount) <= 0 ||
      parseInt(amount) > MAX_EDITIONS ||
      parseFloat(royalties) == null ||
      parseFloat(royalties) < MIN_ROYALTIES ||
      parseFloat(royalties) > MAX_ROYALTIES ||
      !handleRightsValidation() ||
      !file
    ) {
      return true
    }

    if (cover && thumbnail) {
      return false
    }

    return true
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
              className={styles.field}
              type="text"
              onChange={setTitle}
              placeholder="Max 500 characters (optional)"
              label="Title"
              value={title}
            >
              <Line />
            </Input>

            <Textarea
              className={styles.field}
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
              className={styles.field}
              type="text"
              onChange={setTags}
              onBlur={(e) => {
                const tags = _.join(
                  _.uniq(
                    e.target.value
                      .split(',')
                      .map((tag) => tag.trim())
                      .filter((n) => n)
                  ),
                  ','
                )
                setTags(tags)
              }}
              placeholder="Comma separated. example: illustration, digital (optional)"
              label="Tags"
              value={tags}
            >
              <Line />
            </Input>
            <Input
              className={styles.field}
              type="number"
              min={1}
              max={MAX_EDITIONS}
              onChange={setAmount}
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
              className={styles.field}
              type="number"
              min={MIN_ROYALTIES}
              max={MAX_ROYALTIES}
              onChange={setRoyalties}
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
              className={styles.field}
              alt="license selection"
              label="License"
              value={rights}
              placeholder="(optional)"
              onChange={setRights}
              options={LICENSE_TYPES_OPTIONS}
            />

            {rights.value === 'custom' && (
              <Input
                className={styles.field}
                type="text"
                onChange={setRightUri}
                placeholder="The URI to the custom license"
                label="Custom license URI"
                value={rightUri}
              />
            )}
            <Line />
            <Select
              className={styles.field}
              alt="token language"
              label="Language"
              placeholder="(optional)"
              options={LANGUAGES_OPTIONS}
              value={language}
              onChange={setLanguage}
            >
              <Line />
            </Select>
            <div className={styles.attributes_checkboxes}>
              <Checkbox
                label="NSFW"
                checked={nsfw}
                onCheck={setNsfw}
                name="nsfw"
              />
              <Checkbox
                checked={photosensitiveSeizureWarning}
                onCheck={setPhotosensitiveSeizureWarning}
                name="photosens"
                label="Photo Sensitive Seizure Warning"
              />
            </div>
            <Line />
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button onClick={clearFields} fit>
                Clear Fields
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
                <strong>Back</strong>
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
          Terms & Conditions
        </Button>
        <hr />
      </div>
    </Page>
  )
}
