// import type { ChangeEventHandler } from "react";

/** We assume input always return strings
 * (which is the good thing to do apparently)
 * onChange when not using ref will return the parsed value
 * number for "number" inputs, string for the rest)
 */
interface InputProps<T extends number | string> {
  type?: InputType
  placeholder: string
  name?: string
  min?: number
  max?: number
  maxlength?: number
  label?: string
  onChange?: <X>(value: X) => void
  onBlur?: FocusEventHandler<HTMLInputElement>
  // onWheel?: () => void
  disabled?: boolean
  value?: T
  // children?: JSX.Element | JSX.Element[]
  defaultValue?: T
  pattern?: string
  onKeyDown?: (e: KeyboardEvent<HTMLInputElement>) => void
  className?: string
}

type InputType =
  | 'button'
  | 'checkbox'
  | 'color'
  | 'date'
  | 'datetime-local'
  | 'email'
  | 'file'
  | 'hidden'
  | 'image'
  | 'month'
  | 'number'
  | 'password'
  | 'radio'
  | 'range'
  | 'reset'
  | 'search'
  | 'submit'
  | 'tel'
  | 'text'
  | 'time'
  | 'url'
  | 'week'

interface CheckboxProps {
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

interface TextAreaProps {
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
