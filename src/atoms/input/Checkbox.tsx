import { useControlled } from '@hooks/use-controlled'
import styles from '@style'
import classNames from 'classnames'
import React, { useCallback } from 'react'

import type { CheckboxProps } from './types'

const Checkbox = (
  {
    name,
    label,
    alt,
    initial,
    onCheck = () => null,
    onBlur = () => null,
    onWheel = () => null,
    // disabled,
    checked: checkedProp,
    // autoFocus = false,
    className,
    small,
  }: CheckboxProps,
  ref: React.ForwardedRef<HTMLInputElement>
) => {
  const [checked, setChecked] = useControlled(checkedProp, initial)

  const handleCheck = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
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
    <label className={`${classes} ${className || ''}`}>
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

export default React.memo(React.forwardRef(Checkbox))
