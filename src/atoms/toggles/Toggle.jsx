import classnames from 'classnames'
import styles from '@style'
import { useCallback } from 'react'
import { useControlled } from '@hooks/use-controlled'

/**
 * Core toggle used by variants
 * @param {Object} coreToggleProps
 * @param {string} coreToggleProps.label - The text or icon used for the toggle
 * @param {boolean} coreToggleProps.initial - The initial value
 * @param {boolean} coreToggleProps.toggled - If set the control becomes controlled
 * @param {React.CSSProperties} coreToggleProps.style - Style object (as a last resort)
 * @param {string} iconToggleProps.alt - Accessibility name for the toggle
 * @param {(v:boolean) => void} coreToggleProps.onToggle
 *
 */
export const Toggle = ({
  label,
  initial,
  toggled: toggledProp,
  style = {},
  alt,
  box,
  onToggle,
  className,
}) => {
  const [toggled, setToggled] = useControlled(toggledProp, initial)

  const handleToggle = useCallback(
    (e) => {
      const { checked } = e.target
      setToggled(checked)
      onToggle?.(checked)
    },
    [setToggled, onToggle]
  )

  const classes = classnames({
    [styles.base_toggle]: true,
    [styles.box_toggle]: box,
    [styles.toggled]: toggled,
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
