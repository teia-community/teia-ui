import React from 'react'
import classnames from 'classnames'
import styles from '@style'
import { toggleType } from './index'
import { useCallback } from 'react'
import { useControlled } from '@hooks/use-controlled'

/**
 * Core toggle used by variants
 * @param {Object} coreToggleProps
 * @param {string} coreToggleProps.label - The text or icon used for the toggle
 * @param {boolean} coreToggleProps.initial - The initial value
 * @param {boolean} coreToggleProps.toggled - If set the control becomes controlled
 * @param {boolean} coreToggleProps.style - Style object (as a last resort)
 * @param {import("@types").ToggleKind} coreToggleProps.kind - The type of toggle
 * @param {React.EffectCallback} coreToggleProps.onToggle
 *
 */
export const Toggle = ({
  label,
  initial,
  toggled: toggledProp,
  style = {},
  onToggle,
  className,
  kind = toggleType.MINIMAL,
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
    [styles.box_toggle]: kind === toggleType.BOX,
    [styles.minimal_toggle]: kind === toggleType.MINIMAL,
    [styles.toggled]: toggled,
  })

  return (
    <label style={style} className={classes}>
      <input
        defaultChecked={initial}
        checked={toggledProp}
        aria-label={typeof label === 'string' ? label : 'icon-toggle'}
        aria-checked={toggled}
        type="checkbox"
        onChange={handleToggle}
      />
      {label}
    </label>
  )
}

export default Toggle
