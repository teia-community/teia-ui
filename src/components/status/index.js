import React, { useEffect, useCallback } from 'react'
import styles from './styles.module.scss'
import { useState } from 'react'
import { VisuallyHidden } from '../visually-hidden'
import { fetchGraphQL, getDipdupState } from '../../data/hicdex'

export const Status = ({ criticalDelta = 50 }) => {
  const [statusDetails, setStatusDetails] = useState()

  const checkIndexerStatus = useCallback(async () => {
    const tzktStatus = await fetch('https://api.tzkt.io/v1/head').then(
      (res) => res && res.json()
    )

    if (!tzktStatus) {
      return
    }

    const dipdupState = await fetchGraphQL(getDipdupState)
    const mainnetNode = dipdupState.data.hic_et_nunc_dipdup_state.find(
      ({ index_name }) => index_name === 'hen_mainnet'
    )

    if (!mainnetNode) {
      return
    }

    const delta = Math.abs(tzktStatus.level - mainnetNode.level)

    if (delta > criticalDelta) {
      // arbitrary blockchain level comparison
      console.log(
        `Indexer problem: ${tzktStatus.level} vs ${mainnetNode.level} = ${delta}`
      )
      setStatusDetails(
        `Indexer problem: The indexer is currently delayed (-${delta} blocks)`
      )
    }
  }, [criticalDelta])

  useEffect(() => {
    checkIndexerStatus().catch((err) => {
      console.error(err)
    })
  }, [checkIndexerStatus])

  if (!statusDetails) {
    return null
  }

  return (
    <span
      className={styles.status}
      data-position={'bottom'}
      data-tooltip={statusDetails}
      style={{
        marginRight: '10px',
      }}
    >
      <VisuallyHidden>{`${statusDetails}`}</VisuallyHidden>
      🔴
    </span>
  )
}
