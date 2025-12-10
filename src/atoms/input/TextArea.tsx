import styles from '@style'
import { forwardRef, memo, ChangeEvent, ReactNode } from 'react'

interface TextareaProps {
  type?: string
  placeholder?: string
  name?: string
  min?: number | string
  max?: number | string
  children?: ReactNode
  maxlength?: number
  label?: string
  onChange?: (e: ChangeEvent<HTMLTextAreaElement>) => void
  onBlur?: (e: ChangeEvent<HTMLTextAreaElement>) => void
  disabled?: boolean
  value?: string | number
  className?: string
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      type = 'text',
      placeholder = 'placeholder',
      name = 'input-name-not-set',
      min,
      max,
      children,
      maxlength = 50000,
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
)
export default memo(Textarea)
