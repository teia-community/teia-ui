import React from 'react'
import styles from './styles.module.scss'
import ReactSelect from 'react-select'

export const Select = ({
  label,
  value,
  options,
  onChange = () => null,
  ...props
}) => (
  <label className={styles.label}>
    <p>{label}</p>
    <ReactSelect
      className={styles.container}
      onChange={onChange}
      options={options}
      {...props}
    />
  </label>
)
