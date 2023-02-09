import styles from '@style'
import ReactSelect from 'react-select'
import { forwardRef, useCallback } from 'react'
import { useControlled } from '@hooks/use-controlled'

import { style as select_style, theme } from './styles'

/**
 * This is a wrapper of React Select with teia's styling, and useControlled
 * @param {*} param0
 * @returns
 */
const Select = forwardRef(
  (
    {
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
      style,
      ...props
    },
    ref
  ) => {
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
)

export default Select
