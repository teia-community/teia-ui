import classnames from 'classnames'
import styles from '@style'
import React from 'react'

interface LineProps {
  vertical?: boolean
  className?: string
  style?: React.CSSProperties
}

export const Line = ({ vertical, className, style }: LineProps) => {
  const classes = classnames({
    [styles.vertical]: vertical,
    [styles.horizontal]: !vertical,
  })
  return (
    <hr style={style} className={`${className ? className : ''} ${classes} `} />
  )
}
