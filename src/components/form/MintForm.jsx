import Form from './Form'
import mint_fields from '@pages/mint/fields'
import { CollabSwitch } from '@components/collab/CollabSwitch'
import { useEffect, useMemo, useState } from 'react'

import styles from '@pages/mint/index.module.scss'
import { useNavigate, useOutletContext } from 'react-router'
import { motion } from 'framer-motion'
import { useMintStore } from '@context/mintStore'
import { useFormContext, useFormState } from 'react-hook-form'
import { useModalStore } from '@context/modalStore'
import { processTypedInput } from '@utils/typed-art'

export default function MintForm() {
  const {
    artifact,
    license,
    minterName,
    address,
    balance,
    isTyped,
    isMonoType,
  } = useOutletContext()
  const navigate = useNavigate()
  const { control } = useFormContext()
  const { defaultValues } = useFormState({ control })
  const [needsCover, setNeedsCover] = useState(false)
  const [isTypedArt, setIsTypedArt] = useState(false)

  useEffect(() => {
    if (artifact)
      setNeedsCover(
        !artifact?.mimeType?.startsWith('image') &&
          artifact?.mimeType !== 'text/plain'
      )

    /** Typed  */
    setIsTypedArt(isTyped)

    /** Render correct fonts */
    let typedTextArea = document.querySelector("textarea[name='typedinput']")

    if (isMonoType && typedTextArea) {
      typedTextArea.style.fontFamily = 'IBM Plex Mono, monospace'
    } else if (typedTextArea) {
      // default font to use for typed inputs
      typedTextArea.style.fontFamily = 'Source Sans Pro, sans-serif'
    }
  }, [artifact, isTyped, isMonoType])

  const onSubmit = async (data) => {
    // other non-typed types that involves file upload
    if (!isTyped && data.artifact) {
      if (data.artifact.file?.size && data.artifact.file?.size / 1e6 > 2000) {
        useModalStore
          .getState()
          .show(`File too big: ${data.artifact.file.size / 1e6}mb`)
        return
      }
      const URL = window.URL || window.webkitURL
      data.artifact.reader = URL.createObjectURL(data.artifact.file)
    }

    // typed input
    else if (data.typedinput) {
      data = await processTypedInput(data)
    }

    useMintStore.setState({ ...data, isValid: true })
    navigate('preview')
  }

  // Dynamically update conditional fields
  const fields = useMemo(() => {
    return mint_fields({
      needsCover,
      isTyped: isTypedArt,
      showArtifact: !isTypedArt,
      useCustomLicense: license?.value === 'custom',
    })
  }, [needsCover, isTypedArt, license?.value])
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
      />
    </motion.div>
  )
}
