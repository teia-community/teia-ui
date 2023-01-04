import React, { useContext } from 'react'
import { TeiaContext } from '@context/TeiaContext'
import styles from '@style'

export const ButtonTheme = () => {
  const context = useContext(TeiaContext)

  const toggleTheme = () => {
    context.setTheme(context.theme === 'light' ? 'dark' : 'light')
  }

  return (
    <div
      className={styles.button_theme}
      onClick={toggleTheme}
      onKeyPress={toggleTheme}
      role="button"
      tabIndex="0"
    />
  )
}
