interface ButtonProps {
  /**Used for accessibility (aria-label) */
  alt?: string
  /** If provided return a "NavLink" */
  to?: To
  /** If provided return a "a" */
  href?: string
  /**onClick callback, ignore if to is provided */
  onClick?: () => void
  /**@deprecated onClick for NavLinks */
  onTo?: () => void
  children?: string | React.ReactNode
  /**Extra classes to apply to the button */
  className?: string
  style?: React.CSSProperties
  /** Disables the button */
  disabled?: boolean
  selected?: boolean
  /**(Style) Fit */
  fit?: boolean
  /**(Style) Full */
  full?: boolean
  /**(Style) Box (adds nesting) */
  box?: boolean
  strong?: boolean
  /**(Style) Shadow Box (adds nesting)*/
  shadow_box?: boolean
  secondary?: boolean
  small?: boolean
  inline?: boolean
  activeClass?: string
  //props
  [x: string]: any
}
