import React from 'react'
import styles from './styles.module.scss'

export const Select = ({ label, options, onChange = () => null }) => (
  <div className={styles.container}>
    <label>
      <select onChange={onChange}>
        {Object.keys(options).map((key, i) => (
          <option value={key} key={i}>
            {options[key]}
          </option>
        ))}
      </select>
      <p>{label}</p>
    </label>
  </div>
)
