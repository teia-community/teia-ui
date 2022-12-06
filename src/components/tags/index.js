import React, { useContext } from 'react'
import { PATH } from '../../constants'
import { HicetnuncContext } from '../../context/HicetnuncContext'
import { Button } from '../button'
import styles from './styles.module.scss'

export const Tags = ({ tags }) => {
  const context = useContext(HicetnuncContext)

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
