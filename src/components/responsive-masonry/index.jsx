import { useEffect, useState } from 'react'
import Masonry from 'react-masonry-css'
import styles from '@style'

export const ResponsiveMasonry = ({ children }) => {
  const getColumns = () => {
    if (window.innerWidth > 1170) {
      return 4
    }

    if (window.innerWidth > 744) {
      return 3
    }
    if (window.innerWidth > 320) {
      return 2
    }

    return 1
  }
  const [colums, setColumns] = useState(getColumns())

  useEffect(() => {
    const resize = () => {
      setColumns(getColumns())
    }
    window.addEventListener('resize', resize)

    return () => window.removeEventListener('resize', resize)
  }, [])

  return (
    <Masonry
      // cellSpacing={150}
      breakpointCols={colums}
      className={`${styles.grid} no-fool`}
      columnClassName={styles.column}
    >
      {children}
    </Masonry>
  )
}
