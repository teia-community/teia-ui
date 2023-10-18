import { useState } from 'react'
import { useModalStore } from '@context/modalStore'
import { Button } from '@atoms/button'
import { IpfsLink } from '@atoms/link'
import { uploadFileToIPFSProxy } from '@utils/ipfs'
import styles from '@style'

export default function IpfsUploader({
  label,
  placeholder,
  value,
  onChange,
  className,
  displayUploadInformation = true,
  children,
}) {
  // Set the component state
  const [file, setFile] = useState(undefined)

  // Define the on change handler
  const handleChange = (e) => {
    setFile(e.target.files[0])
    onChange('')
  }

  // Define the on click handler
  const handleClick = async (e) => {
    e.preventDefault()
    onChange(await uploadFileToIpfs(file, displayUploadInformation))
  }

  // Define the on clear handler
  const handleClear = async (e) => {
    e.preventDefault()
    setFile(undefined)
    onChange('')
  }

  return (
    <div className={`${styles.container} ${className ?? ''}`}>
      <p>
        <strong>{label}</strong>
      </p>

      {!file && (
        <label>
          {placeholder}
          <input type="file" onChange={handleChange} />
        </label>
      )}

      {file && value === '' && (
        <>
          <button onClick={handleClick} className={styles.ipfs_upload_button}>
            Upload {file.name} to IPFS
          </button>

          <Button onClick={handleClear} small>
            Clear field
          </Button>
        </>
      )}

      {file && value !== '' && (
        <>
          <p className={styles.ipfs_result}>
            <span>
              {file.name} <IpfsLink cid={value}>IPFS</IpfsLink>
            </span>

            <Button onClick={handleClear} small>
              Clear field
            </Button>
          </p>

          {children}
        </>
      )}
    </div>
  )
}

async function uploadFileToIpfs(file, displayUploadInformation) {
  const step = useModalStore.getState().step
  const close = useModalStore.getState().close

  if (displayUploadInformation) {
    step('IPFS upload', `Uploading ${file.name} to IPFS...`)
  }

  const cid = await uploadFileToIPFSProxy(file)

  if (displayUploadInformation) {
    close()
  }

  return cid
}
