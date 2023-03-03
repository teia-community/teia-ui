import styles from '@style'
import ReactSelect from 'react-select'
import { forwardRef, useCallback } from 'react'
import { useControlled } from '@hooks/use-controlled'

import { style as select_style, theme } from './styles'
import type { WithChildren } from '@types'

interface SelectOption {
  label: string
  value: string
}

export interface SelectProps {
  label?: string
  alt?: string
  onChange?: (val: SelectOption) => void
  style?: React.CSSProperties
  value: SelectOption
  search?: boolean
  defaultValue?: SelectOption
  options: SelectOption[]
  disabled?: boolean
  placeholder?: string
  className?: string
}

const Select = (
  {
    label,
    alt,
    value: gValue,
    search = false,
    defaultValue,
    options,
    onChange,
    disabled,
    children,
    placeholder,
    className,
    style,
    ...props
  }: WithChildren<SelectProps>,
  ref: React.ForwardedRef<HTMLInputElement>
) => {
  const [value, setValue] = useControlled(gValue, defaultValue)

  const handleChange = useCallback(
    (e: unknown) => {
      setValue(e as SelectOption)
      onChange?.(e as SelectOption)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [value]
  )

  return (
    <label style={style} className={`${styles.label} ${className || ''}`}>
      <p>{label}</p>
      <ReactSelect
        inputRef={ref}
        aria-label={alt || label}
        styles={select_style}
        theme={theme}
        className={styles.container}
        classNamePrefix="react_select"
        onChange={handleChange}
        options={options}
        disabled={disabled}
        placeholder={placeholder}
        isSearchable={search}
        menuPortalTarget={document.querySelector('body')}
        value={value === (null || undefined) ? '' : value}
        {...props}
      />
      {children}
    </label>
  )
}

export default forwardRef(Select)
