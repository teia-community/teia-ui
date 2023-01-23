import React, { useState } from 'react'
import useLanguage from '@hooks/use-language'
import { getMimeType } from '@utils/sanitise'
import styles from '@style'

const Buffer = require('buffer').Buffer

/**
 * Upload component
 * @param {Object} uploadProps
 * @param {string} uploadProps.label - The displayed label
 * @param {string} uploadProps.allowedTypes - A comma separated list of accepted types
 * @param {boolean} uploadProps.allowedTypesLabel - A comma separated list of label of accepted types
 * @param {import("@types").UploadCallback} uploadProps.onChange - on file change.
 */
export const Upload = ({
  label,
  allowedTypes,
  allowedTypesLabel,
  onChange = () => null,
}) => {
  const { language } = useLanguage()
  const [title, setTitle] = useState(label)

  const onFileChange = async (e) => {
    const { files } = e.target
    const file = files[0]

    setTitle(file.name)
    const mimeType = file.type === '' ? await getMimeType(file) : file.type
    const buffer = Buffer.from(await file.arrayBuffer())

    // set reader for preview
    const reader = new FileReader()
    reader.addEventListener('load', (e) => {
      onChange({ title, mimeType, file, buffer, reader: e.target.result })
    })
    reader.readAsDataURL(file)
  }

  const props = {
    type: 'file',
    name: 'file',
  }

  if (allowedTypes) {
    props.accept = allowedTypes.join(',')
  }

  return (
    <div className={styles.container}>
      <label>
        {title}
        <input {...props} onChange={onFileChange} />
      </label>
      <div className={styles.allowed}>
        {language.mint.supports}:&nbsp;{allowedTypesLabel}
      </div>
    </div>
  )
}
