import styles from '@style'
import type { FocusEventHandler } from 'react'
import { memo, useCallback } from 'react'
import { useControlled } from '@hooks/use-controlled'
import type { KeyboardEvent } from 'react'
import React from 'react'
import type { WithChildren } from '@types'
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

/** We assume input always return strings
 * (which is the good thing to do apparently)
 * onChange when not using ref will return the parsed value
 * number for "number" inputs, string for the rest)
 */
interface InputProps<T> {
  type?: InputType
  placeholder: string
  name?: string
  min?: number
  max?: number
  maxlength?: number
  label?: string
  onChange?: (value: T) => void
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

function Input<T>(
  {
    type = 'text',
    placeholder = 'placeholder',
    name,
    min,
    max,
    maxlength = 500,
    label,
    onChange = (value) => null,
    onBlur,
    // onWheel = () => null,
    disabled,
    value: valueProp,
    children,
    defaultValue,
    pattern,
    onKeyDown,
    className,
  }: WithChildren<InputProps<T>>,
  ref: React.ForwardedRef<HTMLInputElement>
) {
  const [value, setValue] = useControlled(valueProp, defaultValue)

  const handleInput = useCallback(
    (e: React.FormEvent<HTMLInputElement>) => {
      if (ref) {
        onChange(e as T)
        return
      }
      const target = e.target as HTMLInputElement
      if (target) {
        const v =
          type === 'number'
            ? !isNaN(target.valueAsNumber)
              ? target.valueAsNumber
              : target.value
            : target.value

        setValue(v)
        onChange(v as T)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [value]
  )

  return (
    <div className={`${styles.container} ${className || ''}`}>
      <label htmlFor={name}>
        <p>{label || name}</p>
        <input
          type={type}
          ref={ref}
          placeholder={placeholder}
          name={name || label}
          min={min}
          max={max}
          maxLength={maxlength}
          defaultValue={defaultValue as string}
          value={value}
          onChange={handleInput}
          onBlur={onBlur}
          pattern={pattern}
          onWheel={(e) => (e.target as HTMLInputElement).blur()}
          onKeyDown={onKeyDown}
          autoComplete="off"
        />
      </label>
      {children}
    </div>
  )
}

export default memo(React.forwardRef(Input)) as typeof Input
