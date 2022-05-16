import React, { useContext, useEffect, useState } from 'react'
import Compressor from 'compressorjs'
import ipfsHash from 'ipfs-only-hash'
import _ from 'lodash'
import { HicetnuncContext } from '@context/HicetnuncContext'
import { Page, Container, Padding } from '@components/layout'
import { Input, Textarea } from '@components/input'
import { Button, Curate, Primary, Purchase } from '@components/button'
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
  BURN_ADDRESS,
} from '@constants'
import {
  fetchGraphQL,
  getCollabsForAddress,
  getNameForAddress,
} from '@data/hicdex'
import collabStyles from '@components/collab/styles.module.scss'
import classNames from 'classnames'
import { CollabContractsOverview } from '../collaborate/tabs/manage'

const coverOptions = {
  quality: 0.85,
  maxWidth: 1024,
  maxHeight: 1024,
}

const thumbnailOptions = {
  quality: 0.85,
  maxWidth: 350,
  maxHeight: 350,
}

const uriQuery = `query uriQuery($address: String!, $ids: [String!] = "") {
  token(order_by: {id: desc}, where: {artifact_uri: {_in: $ids}, creator_id: {_eq: $address}}) {
    id
    creator {
      address
      name
    }
    token_holders(where: {quantity: {_gt: "0"}}, order_by: {id: asc}) {
      holder {
        address
      }
    }
  }
}`

// @crzypathwork change to "true" to activate displayUri and thumbnailUri
const GENERATE_DISPLAY_AND_THUMBNAIL = true

export const Mint = () => {
  const { mint, acc, setAccount, proxyAddress, setFeedback, syncTaquito } =
    useContext(HicetnuncContext)

  // const history = useHistory()
  const [step, setStep] = useState(0)
  const [title, setTitle] = useState('')
  const [mintName, setMintName] = useState('')
  const [description, setDescription] = useState('')
  const [tags, setTags] = useState('')
  const [amount, setAmount] = useState()
  const [royalties, setRoyalties] = useState()
  const [file, setFile] = useState() // the uploaded file
  const [cover, setCover] = useState() // the uploaded or generated cover image
  const [thumbnail, setThumbnail] = useState() // the uploaded or generated cover image
  const [needsCover, setNeedsCover] = useState(false)
  const [collabs, setCollabs] = useState([])
  const [selectCollab, setSelectCollab] = useState(false)

  // On mount, see if there are available collab contracts
  useEffect(() => {
    // On boot, see what addresses the synced address can manage
    fetchGraphQL(getCollabsForAddress, 'GetCollabs', {
      address: acc?.address,
    }).then(({ data, errors }) => {
      if (data) {
        // const shareholderInfo = data.shareholder.map(s => s.split_contract);
        // setCollabs(shareholderInfo || [])
        const managedCollabs = data.splitcontract
        setCollabs(managedCollabs || [])
      }
    })
    if (hasStoredFields()) restoreFields()
    updateName()
  }, [acc]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    updateName()
    setSelectCollab(false)
  }, [proxyAddress]) // eslint-disable-line react-hooks/exhaustive-deps

  const updateName = () => {
    const currentAddress = proxyAddress || acc?.address

    fetchGraphQL(getNameForAddress, 'GetNameForAddress', {
      address: currentAddress,
    }).then(({ data, errors }) => {
      if (data) {
        const holder = data.holder[0]
        setMintName(holder.name || currentAddress)
      }
    })
  }

  const handleMint = async () => {
    if (!acc) {
      // warning for sync
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
    } else {
      await setAccount()
      console.log(file.mimeType)
      console.log(ALLOWED_MIMETYPES)
      // check mime type
      if (ALLOWED_MIMETYPES.indexOf(file.mimeType) === -1) {
        // alert(
        //   `File format invalid. supported formats include: ${ALLOWED_FILETYPES_LABEL.toLocaleLowerCase()}`
        // )

        setFeedback({
          visible: true,
          message: `File format invalid. supported formats include: ${ALLOWED_FILETYPES_LABEL.toLocaleLowerCase()}`,
          progress: false,
          confirm: true,
          confirmCallback: () => {
            setFeedback({ visible: false })
          },
        })

        return
      }

      // check file size
      const filesize = (file.file.size / 1024 / 1024).toFixed(4)
      if (filesize > MINT_FILESIZE) {
        // alert(
        //   `File too big (${filesize}). Limit is currently set at ${MINT_FILESIZE}MB`
        // )

        setFeedback({
          visible: true,
          message: `Max file size (${filesize}). Limit is currently ${MINT_FILESIZE}MB`,
          progress: false,
          confirm: true,
          confirmCallback: () => {
            setFeedback({ visible: false })
          },
        })

        return
      }

      // file about to be minted, change to the mint screen

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

      console.log({ minterAddress })

      // upload file(s)
      let nftCid
      if (
        [MIMETYPE.ZIP, MIMETYPE.ZIP1, MIMETYPE.ZIP2].includes(file.mimeType)
      ) {
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
          file,
        })
      } else {
        // process all other files
        nftCid = await prepareFile({
          name: title,
          description,
          tags,
          address: minterAddress,
          buffer: file.buffer,
          mimeType: file.mimeType,
          cover,
          thumbnail,
          generateDisplayUri: GENERATE_DISPLAY_AND_THUMBNAIL,
        })
      }

      console.log('Calling mint with', {
        minterAddress,
        amount,
        path: nftCid.path,
        royalties,
      })
      await mint(minterAddress, amount, nftCid.path, royalties)
      clearFields()
    }
  }

  const isDoubleMint = async () => {
    const rawLeaves = false
    const hashv0 = await ipfsHash.of(file.buffer, { cidVersion: 0, rawLeaves })
    const hashv1 = await ipfsHash.of(file.buffer, { cidVersion: 1, rawLeaves })
    console.log(`Current CIDv0: ${hashv0}`)
    console.log(`Current CIDv1: ${hashv1}`)

    const uri0 = `ipfs://${hashv0}`
    const uri1 = `ipfs://${hashv1}`
    const { errors, data } = await fetchGraphQL(uriQuery, 'uriQuery', {
      address: proxyAddress || acc.address,
      ids: [uri0, uri1],
    })

    if (errors) {
      setFeedback({
        visible: true,
        message: `GraphQL Error: ${JSON.stringify(errors)}`,
        progress: false,
        confirm: true,
        confirmCallback: () => {
          setFeedback({ visible: false })
        },
      })
      return true
    } else if (data) {
      const areAllTokensBurned = (data.token || []).every(
        (token) =>
          _.get(token, 'token_holders.0.holder.address') === BURN_ADDRESS
      )

      if (areAllTokensBurned) {
        return false
      }

      setFeedback({
        visible: true,
        message: `Duplicate mint detected: #${data.token[0].id} is already minted`,
        progress: false,
        confirm: true,
        confirmCallback: () => {
          setFeedback({ visible: false })
        },
      })

      return true
    }

    return false
  }

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

  const generateCompressedImage = async (props, options) => {
    const blob = await compressImage(props.file, options)
    const mimeType = blob.type
    const buffer = await blob.arrayBuffer()
    const reader = await blobToDataURL(blob)
    return { mimeType, buffer, reader }
  }

  const compressImage = (file, options) => {
    return new Promise(async (resolve, reject) => {
      new Compressor(file, {
        ...options,
        success(blob) {
          resolve(blob)
        },
        error(err) {
          reject(err)
        },
      })
    })
  }

  const blobToDataURL = async (blob) => {
    return new Promise((resolve, reject) => {
      let reader = new FileReader()
      reader.onerror = reject
      reader.onload = (e) => resolve(reader.result)
      reader.readAsDataURL(blob)
    })
  }

  const handleCoverUpload = async (props) => {
    await generateCoverAndThumbnail(props)
  }

  const generateCoverAndThumbnail = async (props) => {
    // TMP: skip GIFs to avoid making static
    if (props.mimeType === MIMETYPE.GIF) {
      setCover(props)
      setThumbnail(props)
      return
    }

    const cover = await generateCompressedImage(props, coverOptions)
    setCover(cover)

    const thumb = await generateCompressedImage(props, thumbnailOptions)
    setThumbnail(thumb)
  }

  const limitNumericField = async (target, minValue, maxValue) => {
    if (target.value === '') target.value = '' // Seems redundant but actually cleans up e.g. '234e'
    target.value = Math.round(
      Math.max(Math.min(target.value, maxValue), minValue)
    )
  }

  const handleValidation = () => {
    if (
      amount <= 0 ||
      amount > MAX_EDITIONS ||
      royalties < MIN_ROYALTIES ||
      royalties > MAX_ROYALTIES ||
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

  const restoreFields = () => {
    const title = window.localStorage.getItem('objkt::title')
    const description = window.localStorage.getItem('objkt::description')
    const tags = window.localStorage.getItem('objkt::tags')
    const edition_count = window.localStorage.getItem('objkt::edition_count')
    const royalties = window.localStorage.getItem('objkt::royalties')

    setTitle(title)
    setDescription(description)
    setTags(tags)
    setAmount(edition_count)
    setRoyalties(royalties)

    console.log(`
    Restoring fields from localStorage:
      title = ${title}
      description = ${description}
      tags = ${tags}
      edition_count = ${edition_count}
      royalties = ${royalties}
    `)
  }

  const clearFields = () => {
    setTitle('')
    setDescription('')
    setTags('')
    setAmount('')
    setRoyalties('')

    const keys = [
      'objkt::title',
      'objkt::description',
      'objkt::tags',
      'objkt::edition_count',
      'objkt::royalties',
    ]

    keys.forEach((k) => window.localStorage.removeItem(k))
  }

  const hasStoredFields = () => {
    const title = window.localStorage.getItem('objkt::title')
    const description = window.localStorage.getItem('objkt::description')
    const tags = window.localStorage.getItem('objkt::tags')
    const edition_count = window.localStorage.getItem('objkt::edition_count')
    const royalties = window.localStorage.getItem('objkt::royalties')

    return (
      title != null ||
      description != null ||
      tags != null ||
      edition_count != null ||
      royalties != null
    )
  }

  // const proxyDisplay = proxyName || proxyAddress
  // const mintingAs = proxyDisplay || (acc?.name || acc?.address)
  const flexBetween = classNames(collabStyles.flex, collabStyles.flexBetween)

  return (
    <Page title="Mint" large>
      {step === 0 && (
        <>
          {/* User has collabs available */}
          {collabs.length > 0 && (
            <Container>
              <Padding>
                <div className={flexBetween}>
                  <p>
                    <span style={{ opacity: 0.5 }}>minting as</span> {mintName}
                  </p>
                  <Button onClick={() => setSelectCollab(!selectCollab)}>
                    <Purchase>{selectCollab ? 'Cancel' : 'Change'}</Purchase>
                  </Button>
                </div>
              </Padding>
            </Container>
          )}

          {selectCollab && <CollabContractsOverview showAdminOnly={true} />}

          <Container>
            <Padding>
              <Input
                type="text"
                onChange={(e) => {
                  setTitle(e.target.value)
                  window.localStorage.setItem('objkt::title', e.target.value)
                }}
                placeholder="title"
                label="Title"
                value={title}
              />

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
                placeholder="description (max 5000 characters)"
                label="Description"
                value={description}
              />

              <Input
                type="text"
                onChange={(e) => {
                  setTags(e.target.value)
                  window.localStorage.setItem('objkt::tags', e.target.value)
                }}
                placeholder="tags (comma separated. example: illustration, digital)"
                label="Tags"
                value={tags}
              />

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
                placeholder={`Editions (no. editions, 1-${MAX_EDITIONS})`}
                label="Editions"
                value={amount}
              />

              <Input
                type="number"
                min={MIN_ROYALTIES}
                max={MAX_ROYALTIES}
                onChange={(e) => {
                  setRoyalties(e.target.value)
                  window.localStorage.setItem(
                    'objkt::royalties',
                    e.target.value
                  )
                }}
                onBlur={(e) => {
                  limitNumericField(e.target, MIN_ROYALTIES, MAX_ROYALTIES)
                  setRoyalties(e.target.value)
                }}
                placeholder={`Royalties after each sale (between ${MIN_ROYALTIES}-${MAX_ROYALTIES}%)`}
                label="Royalties"
                value={royalties}
              />
            </Padding>
          </Container>

          <Container>
            <Padding>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button onClick={clearFields} fit>
                  <Primary>Clear Fields</Primary>
                </Button>
              </div>
            </Padding>
          </Container>

          <Container>
            <Padding>
              <Upload
                label="Upload OBJKT"
                allowedTypesLabel={ALLOWED_FILETYPES_LABEL}
                onChange={handleFileUpload}
              />
            </Padding>
          </Container>

          {file && needsCover && (
            <Container>
              <Padding>
                <Upload
                  label="Upload cover image"
                  allowedTypes={ALLOWED_COVER_MIMETYPES}
                  allowedTypesLabel={ALLOWED_COVER_FILETYPES_LABEL}
                  onChange={handleCoverUpload}
                />
              </Padding>
            </Container>
          )}

          <Container>
            <Padding>
              <Button onClick={handlePreview} fit disabled={handleValidation()}>
                <Curate>Preview</Curate>
              </Button>
            </Padding>
          </Container>
        </>
      )}

      {step === 1 && (
        <>
          <Container>
            <Padding>
              <div style={{ display: 'flex' }}>
                <Button onClick={() => setStep(0)} fit>
                  <Primary>
                    <strong>Back</strong>
                  </Primary>
                </Button>
              </div>
            </Padding>
          </Container>

          <Container>
            <Padding>
              <Preview
                mimeType={file.mimeType}
                previewUri={file.reader}
                title={title}
                description={description}
                tags={tags}
              />
            </Padding>
          </Container>

          <Container>
            <Padding>
              <Button onClick={handleMint} fit>
                <Purchase>Mint OBJKT</Purchase>
              </Button>
            </Padding>
          </Container>

          <Container>
            <Padding>
              <p>this operation costs 0.08~ tez</p>
              <p>Your royalties upon each sale are {royalties}%</p>
            </Padding>
          </Container>
        </>
      )}

      <Container>
        <Padding>
          <Button href="https://github.com/teia-community/teia-docs/wiki/Core-Values-Code-of-Conduct-Terms-and-Conditions">
            <Primary>Terms & Conditions</Primary>
          </Button>
        </Padding>
      </Container>
      {/*       <BottomBanner>
      Collecting has been temporarily disabled. Follow <a href="https://twitter.com/hicetnunc2000" target="_blank">@hicetnunc2000</a> or <a href="https://discord.gg/jKNy6PynPK" target="_blank">join the discord</a> for updates.
      </BottomBanner> */}
    </Page>
  )
}
