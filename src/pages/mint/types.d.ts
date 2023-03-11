import '@atoms/select/types'
import '@types'

interface MintOutletContext {
  balance?: number
  minterName?: string
  address: string
  artifact?: FileForm
  license?: SelectField
}
interface ImageDimensions {
  imageWidth: number
  imageHeight: number
}
