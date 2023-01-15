import styles from '@style'

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
}) => (
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
        value={value === (null || undefined) ? '' : value}
        onChange={onChange}
        onBlur={onBlur}
        pattern={pattern}
        onWheel={(e) => e.target.blur()}
        onKeyPress={onKeyPress}
        autoComplete="off"
      />
    </label>
    {children}
  </div>
)
