import styles from '@style'
import ReactSelect from 'react-select'
import { memo } from 'react'

const style = {
  option: (provided, state) => ({
    ...provided,
    color: state.isSelected ? 'var(--background-color)' : 'var(--text-color)',
    backgroundColor: state.isSelected
      ? 'var(--text-color)'
      : 'var(--background-color)',
  }),
  valueContainer: (provided) => ({
    ...provided,
    padding: '0px',
  }),
  control: (provided, state) => ({
    ...provided,
    color: state.isSelected ? 'red' : 'var(--text-color)',
    backgroundColor: 'var(--background-color)',
    border: 'none',
  }),
  menu: (provided, state) => ({
    ...provided,
    backgroundColor: 'var(--background-color)',
    zIndex: 9999,
  }),
  menuPortal: (provided) => ({ ...provided, zIndex: 9999 }),
  singleValue: (provided, state) => ({
    ...provided,
    color: 'var(--text-color)',
  }),
}

const theme = (theme) => ({
  ...theme,
  colors: {
    ...theme.colors,
    text: 'var(--background-color)',
    primary: 'var(--text-color)',
  },
})
const Select = ({
  label,
  alt,
  value,
  search = false,
  defaultValue,
  options,
  onChange = () => null,
  disabled,
  children,
  placeholder,
  className,
  ...props
}) => (
  <label className={`${styles.label} ${className || ''}`}>
    <p>{label}</p>
    <ReactSelect
      aria-label={alt || label}
      styles={style}
      theme={theme}
      className={styles.container}
      classNamePrefix="react_select"
      onChange={onChange}
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

export default memo(Select)
