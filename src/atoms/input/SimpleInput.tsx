import styles from '@style'
import { ChangeEvent, ReactNode } from 'react'

interface SimpleInputProps {
  type: string
  label?: string
  min?: number | string
  max?: number | string
  step?: number | string
  minlength?: number
  maxlength?: number
  placeholder?: string
  value?: string | number
  onChange: (value: any) => void
  pattern?: string
  className?: string
  children?: ReactNode
}

export default function SimpleInput({
  type,
  label,
  min,
  max,
  step,
  minlength,
  maxlength,
  placeholder,
  value,
  onChange,
  pattern,
  className,
  children,
}: SimpleInputProps) {
  const handleInput = (e: ChangeEvent<HTMLInputElement>) =>
    onChange(type === 'file' ? e.target.files?.[0] : e.target.value)

  return (
    <div className={`${styles.container} ${className ?? ''}`}>
      <label>
        <p>{label}</p>
        <input
          type={type}
          min={min}
          max={max}
          step={step}
          minLength={minlength}
          maxLength={maxlength}
          placeholder={placeholder}
          value={value}
          onChange={handleInput}
          pattern={pattern}
          autoComplete="off"
        />
      </label>
      {children}
    </div>
  )
}
