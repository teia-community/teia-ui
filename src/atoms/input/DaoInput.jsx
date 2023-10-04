import styles from '@style'

export default function DaoInput({
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
}) {
  const handleInput = (e) =>
    onChange(type === 'file' ? e.target.files?.[0] : e.target.value)

  return (
    <div className={`${styles.container} ${className || ''}`}>
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
