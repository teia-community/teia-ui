import classnames from 'classnames'
import styles from '@style'
import Button from '@atoms/button/Button'
import React from 'react'

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

export const IconToggle = ({
  //   label,
  icon,
  // initial,
  toggled,
  alt,
  // style = {},
  onClick,
}: // className,
IconToggleProps) => {
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
