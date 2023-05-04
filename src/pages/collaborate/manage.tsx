import { useMemo } from 'react'
import { Container } from '@atoms/layout'
import { apiSWR } from '@data/api'
// import { Input } from '@atoms/input'
// import { CountdownTimer } from '@components/collab/manage/CountdownTimer'
import { CollabList } from '@components/collab/manage/CollabList'
import { useUserStore } from '@context/userStore'
// import { useCollabStore } from '@context/collabStore'
// import { shallow } from 'zustand/shallow'
import { Loading } from '@atoms/loading'

export const CollabContractsOverview = ({ showAdminOnly = false }) => {
  const address = useUserStore((st) => st.address)

  // const [
  //   originatedContract,
  // originationOpHash,
  // findOriginatedContractFromOpHash,
  // ] = useCollabStore(
  //   (st) => [
  //     st.originatedContract,
  // st.originationOpHash,
  // st.findOriginatedContractFromOpHash,
  //   ],
  //   shallow
  // )

  // const [collabs, setCollabs] = useState([])
  // const [managedCollabs, setManagedCollabs] = useState([])
  // const [loadingCollabs, setLoadingCollabs] = useState(true)

  // const [checkInterval, setCheckInterval] = useState(30)
  // const [timerEndDate, setTimerEndDate] = useState()

  // TODO - maybe allow manual input of a KT address
  // const [addAddressManually, setAddAddressManually] = useState(false)
  // const [manualAddress, setManualAddress] = useState('')

  // useEffect(() => {
  //   // const isChecking = originationOpHash && !checkingForOrigination
  //   // setCheckingForOrigination(isChecking)

  //   if (!(originationOpHash && !timerEndDate)) {
  //     return
  //   }
  //   const timerDate = new Date()
  //   timerDate.setTime(timerDate.getTime() + checkInterval * 1000)
  //   setTimerEndDate(timerDate)
  // }, [originationOpHash, timerEndDate, checkInterval])

  const { error, data } = apiSWR.useGetCollabsForAddress('/collabs-manage', {
    address: address || '',
  })
  const collabs = useMemo(() => {
    if (!address) {
      return
    }
    console.debug('Now checking for available collabs')

    // On boot, see what addresses the synced address can manage
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

    return availableCollabs
  }, [data, address /*, originatedContract*/, showAdminOnly])
  if (!address) {
    return null
  }
  if (!data) {
    return <Loading message={'Loading Collabs'} />
  }

  if (error) {
    throw error
  }
  // const _onTimerComplete = () => {
  //   findOriginatedContractFromOpHash(originationOpHash)
  //   // setCheckInterval(10)
  // }

  return (
    <Container>
      {/* {originationOpHash && timerEndDate && (
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
      )} */}

      {collabs && collabs.length > 0 && (
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

      {/* {collabs.length === 0 && !originationOpHash && (
        <p>
          {loadingCollabs
            ? 'Looking for collabs...'
            : 'You are not a manager of any collaborations at the moment'}
        </p>
      )} */}
    </Container>
  )
}
