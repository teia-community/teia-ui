import { useState } from 'react'
import _ from 'lodash'

function getDefaultSorting(defaultTableData, columns, keyAccessor) {
  return [...defaultTableData].sort((a, b) => {
    const filterColumn = columns.filter((column) => column.sortbyOrder)

    // Merge all array objects into single object and extract accessor and sortbyOrder keys
    let { accessor = keyAccessor, sortbyOrder = 'desc' } = Object.assign(
      {},
      ...filterColumn
    )

    if (_.get(a, accessor) == null) return 1
    if (_.get(b, accessor) == null) return -1
    if (_.get(a, accessor) == null && _.get(b, accessor) == null) return 0

    const ascending = _.get(a, accessor)
      .toString()
      .localeCompare(_.get(b, accessor).toString(), 'en', {
        numeric: true,
      })

    return sortbyOrder === 'asc' ? ascending : -ascending
  })
}

export const useSortableTable = (data, columns, keyAccessor) => {
  const [tableData, setTableData] = useState(
    getDefaultSorting(data, columns, keyAccessor)
  )

  const handleSorting = (sortField, sortOrder) => {
    if (sortField) {
      const sorted = [...tableData].sort((a, b) => {
        if (_.get(a, sortField) == null) return 1
        if (_.get(b, sortField) == null) return -1
        if (_.get(a, sortField) == null && _.get(b, sortField) == null) return 0
        return (
          _.get(a, sortField)
            .toString()
            .localeCompare(_.get(b, sortField).toString(), 'en', {
              numeric: true,
            }) * (sortOrder === 'asc' ? 1 : -1)
        )
      })
      setTableData(sorted)
    }
  }

  return [tableData, handleSorting]
}
