import React from 'react'
import { ButtonTheme } from '@atoms/button'
import useLanguage from '../../hooks/use-language'
import styles from '@style'

export const CompactFooter = () => {
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
