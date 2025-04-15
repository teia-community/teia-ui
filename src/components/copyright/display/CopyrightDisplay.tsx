'use client'
import { useState, useEffect } from 'react'
import type { CopyrightData } from './CopyrightType'
import { useUserStore } from '@context/userStore'
// import { fetchUserCopyrights } from '@data/fetch'
import CopyrightsGrid from '@components/copyright/display/CopyrightsGrid'

const dummyCopyrights: CopyrightData[] = [
  {
    metadata: {
      name: 'Sample Artwork',
      description: 'A test NFT for copyright preview',
      thumbnailUri: 'https://ipfs.io/ipfs/QmTestHash',
    },
    clauses: {
      reproduce: true,
      broadcast: false,
      publicDisplay: true,
      createDerivativeWorks: true,
      exclusiveRights: 'none',
      retainCreatorRights: true,
      releasePublicDomain: false,
      requireAttribution: true,
      rightsAreTransferable: true,
      expirationDate: '',
      expirationDateExists: false,
      customUriEnabled: false,
      customUri: '',
      addendum: '',
      firstParagraph: '',
    },
    token: {
      tokenId: '1',
      contractAddress: 'KT1DummyContract123',
    },
  },
]

export default function CopyrightDisplay() {
  const address = useUserStore((state) => state.address)
  const [records, setRecords] = useState<CopyrightData[]>(dummyCopyrights)
  const [loading, setLoading] = useState(false)

  // For later: use real fetch when contract is deployed
  /*
  useEffect(() => {
    if (!address) return

    setLoading(true)
    fetchUserCopyrights(address).then((data) => {
      setRecords(data)
      setLoading(false)
    })
  }, [address])
  */

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold mb-6">Your Registered Copyrights</h1>
      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : (
        <CopyrightsGrid copyrights={records} />
      )}
    </div>
  )
}
