import Form from './Form'
import mint_fields from '@pages/mint/fields'
import { CollabSwitch } from '@components/collab/CollabSwitch'
import { useEffect, useMemo, useState } from 'react'

import styles from '@pages/mint/index.module.scss'
import local_styles from '@style'
import { useNavigate, useOutletContext } from 'react-router'
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
import { Midi } from '@tonejs/midi'
import { processMidiCover } from '@utils/midi'

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
  const { control } = useFormContext()
  const { defaultValues } = useFormState({ control })
  const [needsCover, setNeedsCover] = useState(false)
  const [isTypedArt, setIsTypedArt] = useState(false)
  const [preview, setPreview] = useState(null)

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
        data.artifact.mimeType == 'audio/midi' ||
        data.artifact.mimeType == 'audio/mid'
      ) {
        // generate midi cover and set as data.object
        data = await processMidiCover(data)
      }

      useMintStore.setState({ ...data, isValid: true })
      navigate('preview')
    } catch (error) {
      useModalStore.getState().show(error.message)
    }
  }

  return (
    <motion.div
      style={{ width: '100%' }}
      initial={{ x: '-20%', opacity: 0 }}
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
        defaultValues={defaultValues}
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
  )
}
