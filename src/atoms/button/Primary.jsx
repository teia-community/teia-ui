import classnames from 'classnames'
import styles from '@style'

export const Primary = (props) => {
  //{ children = null, selected, menu, left, label = '' }) => {
  const classes = classnames({
    [styles.primary]: true,
    [styles.selected]: props.selected,
    [styles.menu]: props.menu,
    [styles.left]: props.left,
  })
  return (
    <div
      className={`${classes} ${props.className || ''}`}
      role="button"
      aria-label={props.label}
    >
      {props.children}
    </div>
  )
}
