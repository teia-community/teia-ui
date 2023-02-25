import type { ChangeEventHandler } from 'react'

export interface CheckboxProps {
  name: string
  label: string
  alt: string
  initial: boolean
  onCheck: (val: boolean) => void
  onBlur: (e) => void
  onWheel: (e) => void
  //   disabled?: boolean
  /**If set the control becomes controlled*/
  checked?: boolean
  //   autoFocus?: boolean
  className?: string
  small?: boolean
}

export interface TextAreaProps {
  placeholder?: string
  name: string
  maxlength?: number
  label?: string
  onChange: ChangeEventHandler<HTMLTextAreaElement>
  onBlur?: () => void
  disabled?: boolean
  value?: string
  className?: string
}
