import { MIMETYPE } from '@constants'

// check for mymetype using FileReader API (should read any file including binaries)
export const getMimeType = (file: Blob): Promise<string> => {
  return new Promise((resolve) => {
    const filereader = new FileReader()
    filereader.onloadend = function (e: ProgressEvent<FileReader>) {
      if (e.target && e.target.readyState === FileReader.DONE) {
        const uint = new Uint8Array(e.target.result as ArrayBuffer)
        const bytes: string[] = []
        uint.forEach((byte) => {
          bytes.push(byte.toString(16))
        })
        const hex = bytes.join('').toUpperCase()

        let mimeType

        switch (hex) {
          case '7BA2020':
            mimeType = MIMETYPE.GLTF
            break
          case '676C5446':
            mimeType = MIMETYPE.GLB
            break
          default:
            mimeType = 'Unknown MimeType'
        }

        resolve(mimeType)
      }
    }
    filereader.onerror = () => resolve('Unknown MimeType')
    filereader.readAsArrayBuffer(file.slice(0, 4))
  })
}

export const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']

  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${parseFloat((bytes / k ** i).toFixed(dm))} ${sizes[i]}`
}
