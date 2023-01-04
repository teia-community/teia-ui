import React, { useContext } from 'react'
import { PATH } from '../../constants'
import { TeiaContext } from '../../context/TeiaContext'
import { Button } from '@atoms/button'
import styles from '@style'

export const Tags = ({ tags }) => {
  const context = useContext(TeiaContext)

  return (
    <div className={styles.container}>
      {tags
        .filter((e) => e !== '')
        .map((tag, index) => {
          return (
            <Button
              key={`tag${tag}${index}`}
              to={`${PATH.TAGS}/${encodeURI(tag)}`}
            >
              <div
                className={`${styles.tag} ${
                  context.theme === 'light' ? styles.light : styles.dark
                }`}
              >
                {tag}
              </div>
            </Button>
          )
        })}
    </div>
  )
}
