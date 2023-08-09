import styles from '@style'
import type { WithChildren } from '@types'
import React from 'react'

const Textarea = (
  {
    placeholder = 'placeholder',
    name = 'input-name-not-set',
    children,
    maxlength = 5000,
    label,
    onChange = () => null,
    onBlur = () => null,
    disabled,
    value,
    className,
  }: WithChildren<TextAreaProps>,
  ref: React.ForwardedRef<HTMLTextAreaElement>
) => (
  <div className={`${styles.container} ${className || ''}`}>
    <label htmlFor={name}>
      <p>{label}</p>
      <textarea
        ref={ref}
        placeholder={placeholder}
        name={name}
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

export default React.memo(React.forwardRef(Textarea))
