import { useEffect, useState } from 'react'
import Masonry from 'react-masonry-css'
import styles from '@style'

export const ResponsiveMasonry = ({ children }) => {
  const getColumns = () => {
    if (global.innerWidth > 1170) {
      return 4
    }

    if (global.innerWidth > 744) {
      return 3
    }
    if (global.innerWidth > 320) {
      return 2
    }

    return 1
  }
  const [colums, setColumns] = useState(getColumns())

  useEffect(() => {
    const resize = () => {
      setColumns(getColumns())
    }
    global.addEventListener('resize', resize)

    return () => global.removeEventListener('resize', resize)
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
