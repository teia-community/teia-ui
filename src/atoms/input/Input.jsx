import styles from '@style'
import { forwardRef, memo, useCallback } from 'react'
import { useControlled } from '@hooks/use-controlled'

const Input = forwardRef(
  (
    {
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
    },
    ref
  ) => {
    const [value, setValue] = useControlled(valueProp, defaultValue)
    const handleInput = useCallback(
      (e) => {
        if (ref) {
          onChange(e)
          return
        }
        const v = type === 'number' ? e.target.valueAsNumber : e.target.value
        if (isNaN(v)) {
          setValue(v.toString())
          onChange(v.toString())
        } else {
          setValue(v)
          onChange(v)
        }
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
            ref={ref}
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
)

export default memo(Input)
