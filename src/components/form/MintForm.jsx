import Form from './Form'
import mint_fields from '@pages/mint/fields'
import { CollabSwitch } from '@components/collab/CollabSwitch'
import { useEffect, useMemo, useState } from 'react'

import styles from '@pages/mint/index.module.scss'
import local_styles from '@style'
import { useLocation, useNavigate, useOutletContext } from 'react-router'
import { motion } from 'framer-motion'
import { useMintStore } from '@context/mintStore'
import { useFormContext, useFormState } from 'react-hook-form'
import { useModalStore } from '@context/modalStore'
import { processTypedInput } from '@utils/typed-art'
import {
  convertFileToFileForm,
  generateMidiCover,
  generateTypedArtCoverImage,
} from '@utils/mint'
import { AUTO_GENERATE_COVER_MIMETYPES } from '@constants'
import { processMidiCover } from '@utils/midi'
import Tour from '@components/tour'

// Continued on the Preview tab (see components/preview).
const TOUR = [
  { target: 'mint-title', text: 'Give your token a title. Optional.' },
  {
    target: 'mint-text',
    text: 'Tick this to mint text you type here instead of uploading a file.',
  },
  { target: 'mint-description', text: 'Describe your work. Optional.' },
  {
    target: 'mint-tags',
    text: 'Comma separated tags help people find your work. Optional.',
  },
  {
    target: 'mint-editions',
    text: 'How many copies of your token to create.',
  },
  {
    target: 'mint-royalties',
    text: 'The percentage you earn every time a copy is resold.',
  },
  {
    target: 'mint-license',
    text: 'How others may use your work. Optional.',
  },
  {
    target: 'mint-custom-license',
    text: 'Set your own terms for how your work may be used.',
  },
  { target: 'mint-language', text: 'The language of your work. Optional.' },
  { target: 'mint-nsfw', text: 'Tick if your work is not safe for work.' },
  {
    target: 'mint-photosensitive',
    text: 'Tick if your work has flashing that could trigger seizures.',
  },
  { target: 'mint-mono', text: 'Show your text in a monospace font.' },
  {
    target: 'mint-artifact',
    text: 'Upload your file: image, video, audio, PDF, HTML and more.',
  },
  { target: 'mint-typed', text: 'Type your text here.' },
  {
    target: 'mint-cover',
    text: 'Files that are not images need a cover image to show in feeds.',
  },
  {
    target: 'mint-submit',
    text: 'Fill in the required fields, then Submit to preview your token.',
    next: false,
  },
]

export default function MintForm() {
  const {
    artifact,
    license,
    minterName,
    address,
    balance,
    isTyped,
    typedinput,
    isMonoType,
  } = useOutletContext()
  const navigate = useNavigate()
  const { search } = useLocation()
  const [needsCover, setNeedsCover] = useState(false)
  const [isTypedArt, setIsTypedArt] = useState(false)
  const [preview, setPreview] = useState(null)
  const [settled, setSettled] = useState(false)

  // Get the current state from the mint store
  const mintStoreState = useMintStore((state) => state)

  // Dynamically update conditional fields
  const fields = useMemo(() => {
    return mint_fields({
      needsCover,
      isTyped: isTypedArt,
      showArtifact: !isTypedArt,
      useCustomLicense: license?.value === 'custom',
    })
  }, [needsCover, isTypedArt, license?.value])

  useEffect(() => {
    if (artifact)
      setNeedsCover(
        !artifact?.mimeType?.startsWith('image') &&
          !AUTO_GENERATE_COVER_MIMETYPES.includes(artifact?.mimeType)
      )

    /** Typed  */
    setIsTypedArt(isTyped)

    /** Render correct fonts */
    let typedTextArea = document.querySelector("textarea[name='typedinput']")

    if (typedTextArea) {
      typedTextArea.style.fontFamily = isMonoType
        ? 'Iosevka, monospace'
        : 'Source Sans Pro, sans-serif'
    }
  }, [artifact, isTyped, isMonoType, fields])

  useEffect(() => {
    if (isTypedArt) {
      generateCoverImagePreview(typedinput)
    } else {
      setPreview(undefined)
    }
  }, [isTypedArt, typedinput, isMonoType])

  const generateCoverImagePreview = async (inputText) => {
    try {
      const imageFile = await generateTypedArtCoverImage(inputText, isMonoType)
      setPreview(imageFile)
    } catch (error) {
      console.error('Error generating cover image preview:', error.message)
      setPreview(null)
    }
  }

  const onSubmit = async (data) => {
    try {
      // other non-typed nft mints that involves file upload
      if (
        !AUTO_GENERATE_COVER_MIMETYPES.includes(data.artifact?.mimeType) &&
        data.artifact
      ) {
        if (data.artifact.file?.size && data.artifact.file?.size / 1e6 > 2000) {
          throw new Error(`File too big: ${data.artifact.file.size / 1e6}mb`)
        }

        const URL = window.URL || window.webkitURL
        data.artifact.reader = URL.createObjectURL(data.artifact.file)
      } else if (data.typedinput) {
        data = await processTypedInput(data)
      } else if (
        data.artifact.mimeType === 'audio/midi' ||
        data.artifact.mimeType === 'audio/mid'
      ) {
        // generate midi cover and set as data.object
        data = await processMidiCover(data)
      }

      useMintStore.setState({ ...data, isValid: true })
      // keep ?tour so the tour carries on in the preview
      navigate({ pathname: 'preview', search })
    } catch (error) {
      useModalStore.getState().show(error.message)
    }
  }

  // Tour sits outside motion.div (its transform would offset the tour's
  // fixed positioning) and mounts once the slide-in ends, so it measures
  // fields where they come to rest.
  return (
    <>
      {settled && <Tour name="mint" steps={TOUR} />}
      <motion.div
        style={{ width: '100%' }}
        initial={{ x: '-20%', opacity: 0 }}
        onAnimationComplete={() => setSettled(true)}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: '-20%', opacity: 0 }}
        transition={{ ease: 'easeInOut' }}
      >
        <CollabSwitch address={address} name={minterName} />

        {balance > 0 && balance / 1e6 < 0.7 && (
          <div className={styles.fundsWarning}>
            <p>
              {`⚠️ You seem to be low on funds (${
                balance / 1e6
              }ꜩ), mint will probably fail...`}
            </p>
          </div>
        )}
        <Form
          defaultValues={mintStoreState}
          onSubmit={onSubmit}
          onReset={useMintStore.getState().reset}
          fields={fields}
        >
          {preview && (
            <img
              className={local_styles.typed_preview}
              src={URL.createObjectURL(preview)}
              alt="Typed Art Preview"
            />
          )}
        </Form>
      </motion.div>
    </>
  )
}
