import styles from '@style'

export const Checkbox = ({
  name,
  label,
  onChange = () => null,
  onBlur = () => null,
  onWheel = () => null,
  disabled,
  checked = false,
  autoFocus = false,
}) => (
  <label className={styles.check_container}>
    {label}
    <input
      type="checkbox"
      name={name}
      onChange={onChange}
      onBlur={onBlur}
      onWheel={onWheel}
      checked={
        checked === null ? false : checked === undefined ? false : checked
      }
    />
    <span className={styles.checkmark}></span>
  </label>
)
