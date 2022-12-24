import { useState } from 'react'
import styles from '@style'

/**
 * A basic button toggle
 * @param {Object} boxToggleProps
 * @param {string} boxToggleProps.label - The text or icon used for the toggle
 * @param {string} boxToggleProps.tagline - An optional tag line.
 * @param {boolean} boxToggleProps.initial - The initial value.
 *
 */
export const BoxToggle = ({ label, tagline, initial = false, onToggle }) => {
  const [toggled, setToggled] = useState(initial)

  const doToggle = () => {
    setToggled((toggle) => {
      onToggle && onToggle(!toggled)
      return !toggle
    })
  }

  return (
    <button
      className={`${styles.box_toggle} ${toggled ? styles.toggled : ''}`}
      onClick={doToggle}
      onKeyDown={doToggle}
    >
      {label}
    </button>
  )
}
