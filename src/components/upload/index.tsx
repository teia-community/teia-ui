import type { ChangeEvent } from 'react'
import React, { memo, useState } from 'react'
import useLanguage from '@hooks/use-language'
import styles from '@style'
import { getMimeType } from '@utils/sanitise'
import type { FileForm, WithChildren } from '@types'
// import { Buffer } from 'buffer'

interface UploadProps {
  /**The displayed label */
  label: string
  /**A  list of accepted types */
  allowedTypes: string[]
  /**A comma separated list of label of accepted types*/
  allowedTypesLabel: string

  onChange: (file: FileForm) => void

  file: FileForm
  placeHolder?: string

  /** Extra props */
  [x: string]: any
}

/**
 * Upload component
 * @param {Object} uploadProps
 * @param {string} uploadProps.label -
 * @param {string} uploadProps.allowedTypes -
 * @param {boolean} uploadProps.allowedTypesLabel -
 * @param {import("@types").UploadCallback} uploadProps.onChange - on file change.
 */
export const Upload = (
  {
    label,
    file: stateFile,
    placeHolder,
    allowedTypes,
    allowedTypesLabel,
    children,
    onChange,
    ...extra
  }: WithChildren<UploadProps>,
  ref: React.ForwardedRef<HTMLInputElement>
) => {
  const { language } = useLanguage()
  const [title, setTitle] = useState(placeHolder)

  const onFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const { files } = e.target
    if (!files) {
      setTitle(placeHolder)
      return
    }

    const file = files[0]

    setTitle(file.name)
    const mimeType = file.type === '' ? await getMimeType(file) : file.type
    const buffer = Buffer.from(await file.arrayBuffer())

    // set reader for preview
    const reader = new FileReader()
    reader.addEventListener('load', (e) => {
      if (e.target)
        onChange({ title, mimeType, file, buffer, reader: e.target.result })
    })
    reader.readAsDataURL(file)
  }

  const props: { type: string; name: string; accept?: string } = {
    type: 'file',
    name: extra.name || 'file',
    accept: undefined,
  }

  if (allowedTypes) {
    props.accept = allowedTypes.join(',')
  }

  return (
    <div className={styles.container}>
      <strong>{label}</strong>
      <label>
        {title}
        <input {...props} ref={ref} onChange={onFileChange} {...extra} />
      </label>
      <div className={styles.allowed}>
        {language.mint.supports}:&nbsp;{allowedTypesLabel}
      </div>
      {children}
    </div>
  )
}

export default memo(React.forwardRef(Upload))
