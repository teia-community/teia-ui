import styles from '@style'
import { memo, useCallback } from 'react'
import { useControlled } from '@hooks/use-controlled'

const Input = ({
  type = 'text',
  placeholder = 'placeholder',
  name,
  min,
  max,
  maxlength = 500,
  label,
  onChange = (value) => null,
  onBlur = () => null,
  onWheel = () => null,
  disabled,
  value: valueProp,
  children,
  defaultValue,
  pattern,
  onKeyPress,
  className,
}) => {
  const [value, setValue] = useControlled(valueProp, defaultValue)
  const handleInput = useCallback(
    (e) => {
      const v = e.target.value
      setValue(v)
      onChange(v)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [value]
  )

  return (
    <div className={`${styles.container} ${className || ''}`}>
      <label htmlFor={name}>
        <p>{label}</p>
        <input
          type={type}
          placeholder={placeholder}
          name={name || label}
          min={min}
          max={max}
          maxLength={maxlength}
          defaultValue={defaultValue}
          value={value}
          onChange={handleInput}
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
}

export default memo(Input)
