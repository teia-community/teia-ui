import { forwardRef, useState } from 'react'
import useLanguage from '@hooks/use-language'
import styles from '@style'
import { getMimeType } from '@utils/sanitise'
// import { Buffer } from 'buffer'

/**
 * Upload component
 * @param {Object} uploadProps
 * @param {string} uploadProps.label - The displayed label
 * @param {string} uploadProps.allowedTypes - A comma separated list of accepted types
 * @param {boolean} uploadProps.allowedTypesLabel - A comma separated list of label of accepted types
 * @param {import("@types").UploadCallback} uploadProps.onChange - on file change.
 */
interface UploadProps {
  label: string
  file?: any
  placeHolder?: string
  allowedTypes?: string[]
  allowedTypesLabel?: string
  children?: React.ReactNode
  onChange?: (value: any) => void
  name?: string
  [key: string]: any
}

export const Upload = forwardRef<HTMLInputElement, UploadProps>(
  (
    {
      label,
      file: stateFile,
      placeHolder,
      allowedTypes,
      allowedTypesLabel,
      children,
      onChange = () => null,
      ...extra
    },
    ref
  ) => {
    const { language } = useLanguage()
    const [title, setTitle] = useState(placeHolder)

    const onFileChange = async (e) => {
      const { files } = e.target

      const file = files[0]
      if (!file) {
        setTitle(placeHolder)
        return
      }
      setTitle(file.name)
      const mimeType = file.type === '' ? await getMimeType(file) : file.type
      const buffer = Buffer.from(await file.arrayBuffer())

      // set reader for preview
      const reader = new FileReader()
      reader.addEventListener('load', () => {
        onChange({ title, mimeType, file, buffer, reader: reader.result })
      })
      reader.readAsDataURL(file)
    }

    const inputProps: any = {
      type: 'file',
      name: extra.name || 'file',
    }

    if (allowedTypes) {
      inputProps.accept = allowedTypes.join(',')
    }

    return (
      <div className={styles.container}>
        <strong>{label}</strong>
        <label>
          {title}
          <input {...inputProps} ref={ref} onChange={onFileChange} {...extra} />
        </label>
        <div className={styles.allowed}>
          {language.mint.supports}:&nbsp;{allowedTypesLabel}
        </div>
        {children}
      </div>
    )
  }
)
