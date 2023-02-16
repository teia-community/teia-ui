import { useEffect } from 'react'
import { Navigate, useLocation } from 'react-router-dom'

import { useUserStore } from '@context/userStore'

import { Page } from '@atoms/layout'
import { Loading } from '@atoms/loading'
import { Button } from '@atoms/button'
import { shallow } from 'zustand/shallow'

export default function Sync() {
  const location = useLocation()

  const [address, setAccount, proxyAddress, sync] = useUserStore(
    (st) => [st.address, st.setAccount, st.proxyAddress, st.sync],
    shallow
  )

  useEffect(() => {
    const init = async () => {
      if (!address) {
        await sync()
      }
      await setAccount()
    }
    init().catch(console.error)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address])

  const locationSync = (state) => {
    //TODO(mel): is proxy compatible with friends?
    const tg_address = proxyAddress || address
    switch (state) {
      case '/tz':
      case '/feed/friends':
        return `${state}/${tg_address}`
      case '/settings':
      case '/subjkt':
      case '/mint':
      case '/collaborate':
        return state
      default:
        return '/'
    }
  }
  if (address) {
    return <Navigate to={locationSync(location.state)} replace />
  }

  return (
    <Page title="">
      <Loading message="Requesting Permissions" />
      <Button to="/sync">try again?</Button>
    </Page>
  )
}
