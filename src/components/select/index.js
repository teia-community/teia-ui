import React from 'react'
import styles from './styles.module.scss'
import ReactSelect from 'react-select'

const theme = {
  option: (provided, state) => ({
    ...provided,
    // borderBottom: '1px dotted pink',
    // color: state.isSelected ? 'red' : 'blue',
    color: 'var(--text-color)',
    backgroundColor: 'var(--background-color)',
    // padding: 20,
  }),
  control: (provided, state) => {
    // console.log(state)
    return {
      ...provided,
      color: state.isFocused ? 'red' : 'var(--text-color)',
      backgroundColor: 'var(--background-color)',
      border: 'none',

      '&:hover': {
        border: 'none',
      },
      '&:active': {
        border: 'none',
      },

      // none of react-select's styles are passed to <Control />
      // width: 200,
    }
  },
  menu: (provided, state) => ({
    ...provided,
    border: 'none',
    borderBottom: '1px solid var(--text-color)',

    backgroundColor: 'var(--background-color)',
  }),
  clearIndicator: (provided, state) => ({
    ...provided,
    color: 'var(--text-color)',
    backgroundColor: 'var(--background-color)',
  }),
  singleValue: (provided, state) => ({
    ...provided,
    color: 'var(--text-color)',
    backgroundColor: 'var(--background-color)',
    opacity: state.isDisabled ? 0.5 : 1,
    transition: 'opacity 300ms',
    '&:hover': {
      border: 'none',
    },
  }),
}

export const Select = ({
  label,
  value,
  options,
  onChange = () => null,
  disabled,
  ...props
}) => (
  <label className={styles.label}>
    <p>{label}</p>
    <ReactSelect
      styles={theme}
      className={styles.container}
      onChange={onChange}
      options={options}
      disabled={disabled}
      value={value}
      {...props}
    />
  </label>
)
