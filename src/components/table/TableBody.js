import _ from 'lodash'

const TableBody = ({ tableData, columns, keyAccessor }) => {
  return (
    <tbody>
      {tableData.map((data) => {
        return (
          <tr key={_.get(data, keyAccessor)}>
            {columns.map(({ accessor }) => {
              const tData = _.get(data, accessor) || '——'
              return <td key={accessor}>{tData}</td>
            })}
          </tr>
        )
      })}
    </tbody>
  )
}

export default TableBody
