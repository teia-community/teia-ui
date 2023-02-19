import classnames from 'classnames'
import styles from '@style'
import React, { useCallback } from 'react'
import { useControlled } from '@hooks/use-controlled'

interface ToggleProps {
  label?: string
  initial?: boolean
  toggled?: boolean
  style?: React.CSSProperties
  alt?: string
  box?: boolean
  onToggle?: (v: boolean) => void
  className?: string
}

export const Toggle = ({
  label,
  initial,
  toggled: toggledProp,
  style = {},
  alt,
  box,
  onToggle,
  className,
}: ToggleProps) => {
  const [toggled, setToggled] = useControlled(toggledProp, initial)

  const handleToggle = useCallback(
    (e: React.FormEvent<HTMLInputElement>) => {
      const { checked } = e.target as HTMLInputElement
      setToggled(checked)
      onToggle?.(checked)
    },
    [setToggled, onToggle]
  )

  const classes = classnames({
    [styles.base_toggle]: true,
    [styles.box_toggle]: box,
    [styles.toggled]: toggled,
    className,
  })

  return (
    <label style={style} className={classes}>
      <input
        defaultChecked={initial}
        checked={toggledProp}
        aria-label={
          alt ? alt : typeof label === 'string' ? label : 'icon-toggle'
        }
        aria-checked={toggled}
        type="checkbox"
        onChange={handleToggle}
      />
      {label}
    </label>
  )
}

export default Toggle
