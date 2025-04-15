import React from 'react'
import type { CopyrightData } from './CopyrightType'

export default function CopyrightCard({ data }: { data: CopyrightData }) {
  const { metadata, clauses, token } = data

  return (
    <div className="border rounded-xl p-4 shadow-sm bg-white">
      <img
        src={metadata?.thumbnailUri}
        alt={metadata?.name}
        className="w-full h-48 object-cover rounded-md mb-3"
      />
      <h3 className="text-lg font-semibold">{metadata?.name}</h3>
      <p className="text-sm text-gray-600 mb-1">{metadata?.description}</p>
      <p className="text-sm text-gray-500">Token ID: {token.tokenId}</p>
      <p className="text-sm text-gray-500">Contract: {token.contractAddress}</p>
      <div className="mt-2">
        {clauses?.releasePublicDomain ? (
          <span className="text-green-600 font-medium">Public Domain</span>
        ) : (
          <span className="text-blue-600 font-medium">
            {Object.keys(clauses)
              .filter((k) => clauses[k as keyof typeof clauses] === true)
              .slice(0, 3)
              .join(', ') || 'Standard License'}
          </span>
        )}
      </div>
    </div>
  )
}
