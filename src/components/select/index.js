import React from 'react'
import styles from './styles.module.scss'
import ReactSelect from 'react-select'

// const theme = {
//   option: (provided, state) => ({
//     ...provided,
//     // borderBottom: '1px dotted pink',
//     // color: state.isSelected ? 'red' : 'blue',
//     color: 'var(--text-color)',
//     backgroundColor: 'var(--background-color)',
//     // padding: 20,
//   }),
//   control: (provided, state) => {
//     // console.log(state)
//     return {
//       ...provided,
//       color: state.isSelected ? 'red' : 'var(--text-color)',
//       backgroundColor: 'var(--background-color)',
//       border: 'none',

//       '&:hover': {
//         border: 'none',
//       },
//       ':active': {
//         ...provided[':active'],
//         border: 'none',
//         color: 'red'
//       },

//       // none of react-select's styles are passed to <Control />
//       // width: 200,
//     }
//   },
//   menu: (provided, state) => ({
//     ...provided,

//     "&:hover": {
//       backgroundColor: 'red',
//     }
//   }),
//   clearIndicator: (provided, state) => ({
//     ...provided,

//   }),
//   singleValue: (provided, state) => ({
//     ...provided,

//   }),
// }

export const Select = ({
  label,
  value,
  defaultValue,
  options,
  onChange = () => null,
  disabled,
  placeholder,
  ...props
}) => {
  console.log(
    `Creating select with label: ${label}, value: ${value}, defaultValue: ${defaultValue}`
  )
  return (
    <label className={styles.label}>
      <p>{label}</p>
      <ReactSelect
        // styles={theme}
        className={styles.container}
        onChange={onChange}
        options={options}
        disabled={disabled}
        placeholder={placeholder}
        value={value === null ? '' : value}
        {...props}
      />
    </label>
  )
}
