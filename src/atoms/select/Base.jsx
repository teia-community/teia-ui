import styles from '@style'
import ReactSelect from 'react-select'
import { memo, useCallback } from 'react'
import { useControlled } from '@hooks/use-controlled'

import { style, theme } from './styles'

const Select = ({
  label,
  alt,
  value: gValue,
  search = false,
  defaultValue,
  options,
  onChange = () => null,
  disabled,
  children,
  placeholder,
  className,
  ...props
}) => {
  const [value, setValue] = useControlled(gValue, defaultValue)

  const handleChange = useCallback(
    (e) => {
      setValue(e)
      onChange(e)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [value]
  )
  return (
    <label className={`${styles.label} ${className || ''}`}>
      <p>{label}</p>
      <ReactSelect
        aria-label={alt || label}
        styles={style}
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

export default memo(Select)
