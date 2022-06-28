import React from 'react'
import styles from './styles.module.scss'

export const Input = ({
  type = 'text',
  placeholder = 'placeholder',
  name,
  min,
  max,
  maxlength = 500,
  label,
  onChange = () => null,
  onBlur = () => null,
  onWheel = () => null,
  disabled,
  value,
  children,
  defaultValue,
  pattern,
  onKeyPress,
  autoFocus = false,
}) => {
  //console.log(label,value,defaultValue)
  return (
    <div className={styles.container}>
      <label htmlFor={name}>
        <p>{label}</p>
        <input
          type={type}
          placeholder={placeholder}
          name={name || label}
          min={min}
          max={max}
          maxLength={maxlength}
          defaultValue={defaultValue === null ? '' : defaultValue}
          value={value === null ? '' : value === undefined ? '' : value}
          onChange={onChange}
          onBlur={onBlur}
          pattern={pattern}
          onWheel={onWheel}
          onKeyPress={onKeyPress}
          autoFocus={autoFocus}
        />
      </label>
      {children}
    </div>
  )
}

export const Checkbox = ({
  name,
  label,
  onChange = () => null,
  onBlur = () => null,
  onWheel = () => null,
  disabled,
  checked = false,
  autoFocus = false,
}) => (
  <label className={styles.check_container}>
    {label}
    <input
      type="checkbox"
      name={name}
      onChange={onChange}
      onBlur={onBlur}
      onWheel={onWheel}
      autoFocus={autoFocus}
      checked={
        checked === null ? false : checked === undefined ? false : checked
      }
    />
    <span className={styles.checkmark}></span>
  </label>
)

export const Textarea = ({
  type = 'text',
  placeholder = 'placeholder',
  name = 'input-name-not-set',
  min,
  max,
  children,
  maxlength = 5000,
  label,
  onChange = () => null,
  onBlur = () => null,
  disabled,
  value,
}) => (
  <div className={styles.container}>
    <label htmlFor={name}>
      <p>{label}</p>
      <textarea
        type={type}
        placeholder={placeholder}
        name={name}
        min={min}
        max={max}
        maxLength={maxlength}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        disabled={disabled}
      />
    </label>
    {children}
  </div>
)
