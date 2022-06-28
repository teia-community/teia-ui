import React from 'react'
import styles from './styles.module.scss'
import ReactSelect from 'react-select'

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
    // none of react-select's styles are passed to <Control />
    // width: 200,
  }),
  menu: (provided, state) => ({
    ...provided,
    backgroundColor: 'var(--background-color)',
  }),
  clearIndicator: (provided, state) => ({
    ...provided,
  }),
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
export const Select = ({
  label,
  value,
  defaultValue,
  options,
  onChange = () => null,
  disabled,
  children,
  placeholder,
  ...props
}) => {
  // console.log(
  //   `Creating select with label: ${label}, value: ${value}, defaultValue: ${defaultValue}`
  // )
  return (
    <label className={styles.label}>
      <p>{label}</p>
      <ReactSelect
        styles={style}
        theme={theme}
        className={styles.container}
        classNamePrefix="react_select"
        onChange={onChange}
        options={options}
        disabled={disabled}
        placeholder={placeholder}
        value={value === (null || undefined) ? '' : value}
        {...props}
      />
      {children}
    </label>
  )
}
