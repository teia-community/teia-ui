import React from 'react'
import classnames from 'classnames'
import styles from '@style'
import Button from '@atoms/button/Button'

/**
 * Button wrapper with styles to act as toggles. (logic should happen in the parent, see feed toolbar)
 * @param {Object} iconToggleProps
 * @param {import('react').ReactElement} iconToggleProps.icon - The icon used for the toggle
 * @param {boolean} iconToggleProps.toggled - Required, this is a controlled component by default.
 * @param {string} iconToggleProps.className - Style object (as a last resort)
 * @param {string} iconToggleProps.alt - Accessibility name for the toggle
 * @param {React.CSSProperties} iconToggleProps.style - Style object (as a last resort)
 * @param {() => void} iconToggleProps.onClick
 *
 */
export const IconToggle = ({
  //   label,
  icon,
  initial,
  toggled,
  alt,
  style = {},
  onClick,
  className,
}) => {
  //   const [toggled, setToggled] = useControlled(toggledProp, initial)

  const classes = classnames({
    [styles.base_toggle]: true,
    [styles.minimal_toggle]: true,
    [styles.toggled]: toggled,
  })

  return (
    <Button onClick={onClick} alt={alt} className={classes}>
      {icon}
    </Button>
  )
}

export default IconToggle
