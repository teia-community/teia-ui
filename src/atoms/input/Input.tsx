import styles from '@style'
import { memo, useCallback } from 'react'
import { useControlled } from '@hooks/use-controlled'
import React from 'react'
import type { WithChildren } from '@types'

function Input<T extends number | string>(
  {
    type = 'text',
    placeholder = 'placeholder',
    name,
    min,
    max,
    maxlength = 500,
    label,
    onChange,
    onBlur,
    // onWheel = () => null,
    disabled,
    value: valueProp,
    children,
    defaultValue,
    pattern,
    onKeyDown,
    className = '',
  }: WithChildren<InputProps<T>>,
  ref: React.ForwardedRef<HTMLInputElement>
) {
  const [value, setValue] = useControlled<T>(valueProp, defaultValue)

  const handleInput = useCallback(
    (e: React.FormEvent<HTMLInputElement>) => {
      if (ref) {
        onChange?.(e)
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

        setValue(v as T)
        onChange?.(v as T)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [value]
  )

  return (
    <div className={`${styles.container} ${className}`}>
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
