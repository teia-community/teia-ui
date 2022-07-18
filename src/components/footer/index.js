import React from 'react'
import { ButtonTheme } from '../button-theme'
import useLanguage from '../../hooks/use-language'
import styles from './styles.module.scss'

export const Footer = () => {
  const { language } = useLanguage()

  return (
    <footer className={styles.container}>
      <div>
        <div className={styles.copy}>{language.footer.mint}</div>
        <div className={styles.buttons}>
          <ButtonTheme />
        </div>
      </div>

      {false && (
        <div>
          <div className={styles.warning}>{language.footer.warning}</div>
        </div>
      )}
    </footer>
  )
}
