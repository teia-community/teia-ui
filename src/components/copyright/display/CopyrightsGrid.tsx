import React from 'react'
import type { CopyrightData } from './CopyrightType'
import CopyrightCard from './CopyrightCard'

type Props = {
  copyrights: CopyrightData[]
}

export default function CopyrightsGrid({ copyrights }: Props) {
  if (!copyrights || copyrights.length === 0) {
    return <p className="text-gray-500">No copyrights found.</p>
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
      {copyrights.map((item, idx) => (
        <CopyrightCard key={idx} data={item} />
      ))}
    </div>
  )
}
