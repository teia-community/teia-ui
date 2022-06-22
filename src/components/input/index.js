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
  defaultValue,
  pattern,
  onKeyPress,
  autoFocus = false,
}) => (
  <div className={styles.container}>
    <label>
      <input
        type={type}
        placeholder={placeholder}
        name={name || label}
        min={min}
        max={max}
        maxLength={maxlength}
        defaultValue={defaultValue === null ? undefined : defaultValue}
        value={value === null ? '' : value}
        onChange={onChange}
        onBlur={onBlur}
        pattern={pattern}
        onWheel={onWheel}
        onKeyPress={onKeyPress}
        autoFocus={autoFocus}
      />
      <p>{label}</p>
    </label>
  </div>
)

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
      checked={checked}
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
  maxlength = 5000,
  label,
  onChange = () => null,
  onBlur = () => null,
  disabled,
  value,
}) => (
  <div className={styles.container}>
    <label>
      <textarea
        type={type}
        placeholder={placeholder}
        name={name}
        min={min}
        max={max}
        maxLength={maxlength}
        defaultValue={value}
        onChange={onChange}
        onBlur={onBlur}
        disabled={disabled}
      />
      <p>{label}</p>
    </label>
  </div>
)
