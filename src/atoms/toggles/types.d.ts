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

interface IconToggleProps {
  // label:string
  icon: React.ReactNode
  // initial: boolean
  toggled: boolean
  alt: string
  // className?: string
  // style?: React.CSSProperties
  onClick: () => void
}
