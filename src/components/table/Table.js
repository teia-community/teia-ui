import TableBody from './TableBody'
import TableHead from './TableHead'
import { useSortableTable } from '@utils/useSortableTable'
import styles from './styles.module.scss'
const Table = ({ caption, data, columns, keyAccessor, defaultSort }) => {
  const [tableData, handleSorting] = useSortableTable(
    data,
    columns,
    keyAccessor,
    defaultSort
  )

  return (
    <table className={styles.table}>
      <caption>{caption}</caption>
      <TableHead {...{ columns, handleSorting }} />
      <TableBody {...{ columns, tableData, keyAccessor }} />
    </table>
  )
}

export default Table
