import { useState } from 'react'

import { ArrowUpDown, ArrowDown, ArrowUp } from '@icons'
import { IconCache } from '@utils/with-icon'

const TableHead = ({ columns, handleSorting }) => {
  const [sortField, setSortField] = useState('')
  const [order, setOrder] = useState('asc')

  const handleSortingChange = (accessor) => {
    const sortOrder = accessor === sortField && order === 'asc' ? 'desc' : 'asc'
    setSortField(accessor)
    setOrder(sortOrder)
    handleSorting(accessor, sortOrder)
  }
  // const ArrowDown = ArrowUpDown
  // const ArrowDefault = ArrowUpDown

  return (
    <thead>
      <IconCache.Provider value={{}}>
        <tr>
          {columns.map(({ label, accessor, sortable, sort_key }) => {
            const sort_accessor = sort_key || accessor
            const Arrow = sortable
              ? sortField === sort_accessor && order === 'asc'
                ? ArrowUp
                : sortField === sort_accessor && order === 'desc'
                ? ArrowDown
                : ArrowUpDown
              : 'p'
            return (
              <th
                key={accessor}
                onClick={
                  sortable ? () => handleSortingChange(sort_accessor) : null
                }
              >
                {label}
                <Arrow size={15} viewBox={60} />
              </th>
            )
          })}
        </tr>
      </IconCache.Provider>
    </thead>
  )
}

export default TableHead
