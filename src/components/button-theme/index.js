import React, { useContext } from 'react'
import { HicetnuncContext } from '../../context/HicetnuncContext'
import styles from './styles.module.scss'

export const ButtonTheme = () => {
  const context = useContext(HicetnuncContext)

  const toggleTheme = () => {
    context.setTheme(context.theme === 'light' ? 'dark' : 'light')
  }

  return (
    <div
      className={styles.container}
      onClick={toggleTheme}
      onKeyPress={toggleTheme}
      role="button"
      tabIndex="0"
    />
  )
}
