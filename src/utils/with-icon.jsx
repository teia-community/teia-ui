import React, { memo } from 'react'
import hash from 'fnv1a'

export const IconCache = React.createContext({})
export const useIconCache = () => React.useContext(IconCache)

const withIcon = (icon) => {
  const Icon = (props) => {
    const { size = 30, viewBox = null } = props
    const cache = useIconCache()

    const cachedId = cache[icon]
    let id

    if (!cachedId) {
      id = 'icon-' + hash(icon).toString(16)
      cache[icon] = id
    }

    return (
      <svg
        viewBox={`0 0 ${viewBox || size} ${viewBox || size}`}
        width={size}
        height={size}
        fill="none"
        dangerouslySetInnerHTML={{
          __html: cachedId
            ? `<use href="#${cachedId}" />`
            : `<g id="${id}">${icon}</g>`,
        }}
      />
    )
  }

  return memo(Icon)
}

export default withIcon
