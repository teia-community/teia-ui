interface SelectField {
  label?: string
  value: string
}

interface SelectOption {
  label: string
  value: string
}

interface SelectProps {
  label?: string
  alt?: string
  onChange?: (val: SelectOption) => void
  style?: React.CSSProperties
  value: SelectOption
  search?: boolean
  defaultValue?: SelectOption
  options: SelectOption[]
  disabled?: boolean
  placeholder?: string
  className?: string
}
