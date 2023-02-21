import React, { memo } from 'react'
import hash from 'fnv1a'

// The HOC
export const IconCache = React.createContext<{ [key: string]: string }>({})
// The Hook
export const useIconCache = () => React.useContext(IconCache)

interface WithIconProps {
  size: number
  viewBox: number
}

// SVG Icon Cache system using refs
const withIcon = (icon: string, defaultViewBox?: number) => {
  const Icon = (props: WithIconProps) => {
    const { size = 30, viewBox = defaultViewBox } = props
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
