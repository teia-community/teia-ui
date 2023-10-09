import { useState } from 'react'
import { useModalStore } from '@context/modalStore'
import { uploadFileToIPFSProxy } from '@utils/ipfs'
import styles from '@style'

export default function IpfsUploader({
  label,
  placeholder,
  value,
  onChange,
  className,
  displayUploadInformation = true,
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
    if (value !== '') return
    onChange(await uploadFileToIpfs(file, displayUploadInformation))
  }

  return (
    <div className={`${styles.container} ${className ?? ''}`}>
      <p>
        <strong>{label}</strong>
      </p>
      <label>
        {file ? file.name : placeholder}
        <input type="file" onChange={handleChange} />
      </label>
      {file && (
        <button onClick={handleClick}>
          {value !== ''
            ? `${file.name} has been uploaded to IPFS`
            : `Upload ${file.name} to IPFS`}
        </button>
      )}
    </div>
  )
}

async function uploadFileToIpfs(file, displayUploadInformation) {
  const show = useModalStore.getState().show
  const step = useModalStore.getState().step
  const close = useModalStore.getState().close
  const modalTitle = 'IPFS upload'

  if (!file) {
    show(modalTitle, 'You need to select a file before uploading it to IPFS')
    return
  }

  if (displayUploadInformation) {
    step(modalTitle, `Uploading ${file.name} to IPFS...`)
  }

  const cid = await uploadFileToIPFSProxy(file)
  console.log(`File IPFS cid: ${cid}`)

  if (displayUploadInformation) {
    close()
  }

  return cid
}
