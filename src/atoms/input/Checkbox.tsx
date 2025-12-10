import { useControlled } from '@hooks/use-controlled'
import styles from '@style'
import classNames from 'classnames'
import { forwardRef, useCallback, memo, ChangeEvent, ReactNode } from 'react'

interface CheckboxProps {
  name?: string
  label?: ReactNode
  alt?: string
  initial?: boolean
  onCheck?: (checked: boolean) => void
  onBlur?: () => void
  onWheel?: () => void
  title?: string
  disabled?: boolean
  checked?: boolean
  autoFocus?: boolean
  className?: string
  small?: boolean
}

/**
 * Core checkbox
 */
const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      name,
      label,
      alt,
      initial,
      onCheck = () => null,
      onBlur = () => null,
      onWheel = () => null,
      title = '',
      disabled,
      checked: checkedProp,
      autoFocus = false,
      className,
      small,
    },
    ref
  ) => {
    const [checked, setChecked] = useControlled<boolean | undefined>(checkedProp, initial)

    const handleCheck = useCallback(
      (e: ChangeEvent<HTMLInputElement>) => {
        if (disabled) return
        const c = e.target.checked
        setChecked(c)
        onCheck?.(c)
      },
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [checked, disabled]
    )

    const classes = classNames({
      [styles.check_container]: true,
      [styles.small]: small,
    })

    return (
      <label
        title={title}
        className={`${classes} ${className ? className : ''}`}
      >
        {label}
        <input
          ref={ref}
          aria-label={alt || name}
          defaultChecked={initial}
          type="checkbox"
          name={name}
          onChange={handleCheck}
          onBlur={onBlur}
          onWheel={onWheel}
          checked={checkedProp}
          aria-checked={checked}
          disabled={disabled}
          autoFocus={autoFocus}
        />
        <span className={styles.checkmark} />
      </label>
    )
  }
)

export default memo(Checkbox)
