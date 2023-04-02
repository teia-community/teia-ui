import { useControlled } from '@hooks/use-controlled'
import styles from '@style'
import classNames from 'classnames'
import { forwardRef, useCallback } from 'react'
import { memo } from 'react'

/**
 * Core checkbox
 * @param {Object} checkboxProps
 * @param {string} checkboxProps.label - The text or icon used for the toggle
 * @param {boolean} checkboxProps.initial - The initial value
 * @param {boolean} checkboxProps.checked - If set the control becomes controlled
 * @param {boolean} checkboxProps.style - Style object (as a last resort)
 * @param {React.EffectCallback} checkboxProps.onCheck
 * @param {boolean} checkboxProps.disabled - Disables the checkbox
 *
 */
const Checkbox = forwardRef(
  (
    {
      name,
      label,
      alt,
      initial,
      onCheck = () => null,
      onBlur = () => null,
      onWheel = () => null,
      disabled,
      checked: checkedProp,
      autoFocus = false,
      className,
      small,
    },
    ref
  ) => {
    const [checked, setChecked] = useControlled(checkedProp, initial)

    const handleCheck = useCallback(
      (e) => {
        const c = e.target.checked
        setChecked(c)
        onCheck?.(c)
      },
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [checked]
    )

    const classes = classNames({
      [styles.check_container]: true,
      [styles.small]: small,
    })

    return (
      <label className={`${classes} ${className ? className : ''}`}>
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
        />
        <span className={styles.checkmark} />
      </label>
    )
  }
)

export default memo(Checkbox)
