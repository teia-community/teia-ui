interface DropdownProps {
  menuID: string
  /** Callback when dropdown closed/clicked outside */
  setOpen: (isOpen: boolean) => void
  children: JSX.Element | JSX.Element[]
  vertical?: boolean
  left?: boolean
}

interface DropdownButtonProps {
  menuID: string
  direction: 'left' | 'right'
  label: string
  alt?: string
  icon?: React.ReactNode
  toggled: boolean
  onClick?: () => void
  className?: string
}

interface ChildProps {
  left?: boolean
}
