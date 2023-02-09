import styles from '@style'
import { forwardRef, memo } from 'react'

const Textarea = forwardRef(
  (
    {
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
      className,
    },
    ref
  ) => (
    <div className={`${styles.container} ${className || ''}`}>
      <label htmlFor={name}>
        <p>{label}</p>
        <textarea
          ref={ref}
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
)
export default memo(Textarea)
