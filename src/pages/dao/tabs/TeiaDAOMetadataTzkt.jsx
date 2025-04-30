import { useState, useEffect } from 'react'
import { getTzktData } from '@data/api'

const TeiaTokenMetadata = () => {
  const [tokenData, setTokenData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchTokenData = async () => {
      try {
        const response = await getTzktData(
          '/v1/tokens?contract=KT1QrtA753MSv8VGxkDrKKyJniG5JtuHHbtV&tokenId=0'
        )
        if (response && response.length > 0) {
          setTokenData(response[0])
        } else {
          setError('No token data found.')
        }
      } catch (error) {
        setError('Failed to fetch token data.')
        console.error('Error fetching token data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchTokenData()
  }, [])

  if (isLoading) {
    return <p>Loading token data...</p>
  }

  if (error) {
    return <p>{error}</p>
  }

  if (!tokenData) {
    return <p>No token data available.</p>
  }

  return (
    <div className="teia-token-metadata">
      <h2>
        <strong>Symbol:</strong> {tokenData.metadata.symbol}
      </h2>
      <br />
      <p>
        <strong>Token ID:</strong> {tokenData.tokenId}
      </p>
      <p>
        <strong>Token Standard:</strong> {tokenData.standard}
      </p>
      <p>
        <strong>Contract Alias:</strong> {tokenData.contract.alias}
      </p>
      <p>
        <strong>Contract Address:</strong> {tokenData.contract.address}
      </p>
      <p>
        <strong>First Minter Alias:</strong>{' '}
        {tokenData.firstMinter?.alias || 'N/A'}
      </p>
      <p>
        <strong>First Minter Address:</strong>{' '}
        {tokenData.firstMinter?.address || 'N/A'}
      </p>
      <p>
        <strong>Transfers Count:</strong> {tokenData.transfersCount}
      </p>
      <p>
        <strong>Balances Count:</strong> {tokenData.balancesCount}
      </p>
      <p>
        <strong>Holders Count:</strong> {tokenData.holdersCount}
      </p>
      <p>
        <strong>Total Minted:</strong>{' '}
        {(parseInt(tokenData.totalMinted) / 1000000).toFixed(2)} TEIA
      </p>
      <p>
        <strong>Total Burned:</strong>{' '}
        {(parseInt(tokenData.totalBurned) / 1000000).toFixed(2)} TEIA
      </p>
      <p>
        <strong>Total Supply:</strong>{' '}
        {(parseInt(tokenData.totalSupply) / 1000000).toFixed(2)} TEIA
      </p>
    </div>
  )
}

export default TeiaTokenMetadata
