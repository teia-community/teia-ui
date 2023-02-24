import type { SelectField } from '@atoms/select/types'
import type { FileForm } from '@types'

export interface MintOutletContext {
  balance?: number
  minterName?: string
  address: string
  artifact?: FileForm
  license?: SelectField
}
