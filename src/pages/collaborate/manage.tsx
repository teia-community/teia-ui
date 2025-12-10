import { useState, useEffect } from 'react'
import { Container } from '@atoms/layout'
import styles from '@components/collab/index.module.scss'
import { fetchGraphQL, getCollabsForAddress } from '@data/api'
// import { Input } from '@atoms/input'
import { CountdownTimer } from '@components/collab/manage/CountdownTimer'
import { CollabList } from '@components/collab/manage/CollabList'
import { useUserStore } from '@context/userStore'
import { useCollabStore } from '@context/collabStore'
import { shallow } from 'zustand/shallow'

export const CollabContractsOverview = ({ showAdminOnly = false }) => {
  const address = useUserStore((st) => st.address)

  const [
    originatedContract,
    originationOpHash,
    findOriginatedContractFromOpHash,
  ] = useCollabStore(
    (st) => [
      st.originatedContract,
      st.originationOpHash,
      st.findOriginatedContractFromOpHash,
    ],
    shallow
  )

  const [collabs, setCollabs] = useState([])
  // const [managedCollabs, setManagedCollabs] = useState([])
  const [loadingCollabs, setLoadingCollabs] = useState(true)

  const [checkInterval, setCheckInterval] = useState(30)
  const [timerEndDate, setTimerEndDate] = useState()

  // TODO - maybe allow manual input of a KT address
  // const [addAddressManually, setAddAddressManually] = useState(false)
  // const [manualAddress, setManualAddress] = useState('')

  useEffect(() => {
    // const isChecking = originationOpHash && !checkingForOrigination
    // setCheckingForOrigination(isChecking)

    if (!(originationOpHash && !timerEndDate)) {
      return
    }
    const timerDate = new Date()
    timerDate.setTime(timerDate.getTime() + checkInterval * 1000)
    setTimerEndDate(timerDate)
  }, [originationOpHash, timerEndDate, checkInterval])

  useEffect(() => {
    if (!address) {
      return
    }

    setLoadingCollabs(true)
    console.debug('Now checking for available collabs')

    // On boot, see what addresses the synced address can manage
    fetchGraphQL(getCollabsForAddress, 'GetCollabs', {
      address,
    }).then(({ data }) => {
      setLoadingCollabs(false)

      if (!data) {
        return
      }
      const allCollabs = data.split_contracts || []
      const adminCollabs = allCollabs.filter(
        (c) => c.administrator_address === address
      )
      const participantCollabs = allCollabs.filter(
        (c) => c.administrator_address !== address
      )

      // Show admin followed by participant
      const availableCollabs = showAdminOnly
        ? allCollabs.filter((c) => c.administrator_address === address)
        : [...adminCollabs, ...participantCollabs]

      setCollabs(availableCollabs)
    })
  }, [address, originatedContract, showAdminOnly])

  const _onTimerComplete = () => {
    findOriginatedContractFromOpHash(originationOpHash)
    setCheckInterval(10)
  }

  return (
    <Container>
      {originationOpHash && timerEndDate && (
        <p className={styles.mb3}>
          Collab contract creation in progress...{' '}
          <CountdownTimer
            endDate={timerEndDate}
            onComplete={_onTimerComplete}
          />
        </p>
      )}

      {originatedContract && (
        <div className={styles.mb3}>
          <p>
            <strong>Collaborative contract created successfully!</strong>
          </p>
          <p>Address: {originatedContract.address}</p>
        </div>
      )}

      {collabs.length > 0 && (
        <CollabList
          description={
            showAdminOnly
              ? 'you can mint with these collab contracts:'
              : 'you are part of these collab contracts:'
          }
          collabs={collabs}
        />
      )}

      {/* {collabs.length > 0 && (
                    <CollabList
                        description="You are a participant in these collabs:"
                        collabs={collabs}
                    />
                )} */}

      {collabs.length === 0 && !originationOpHash && (
        <p>
          {loadingCollabs
            ? 'Looking for collabs...'
            : 'You are not a manager of any collaborations at the moment'}
        </p>
      )}
    </Container>
  )
}
