import { useContext, useEffect } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { TeiaContext } from '@context/TeiaContext'
import { Page, Container } from '@atoms/layout'
import { Loading } from '@atoms/loading'
import { Button } from '@atoms/button'

export default function Sync() {
  const location = useLocation()
  const context = useContext(TeiaContext)

  useEffect(() => {
    const init = async () => {
      if (!context.address) {
        await context.syncTaquito()
      }
      await context.setAccount()
    }
    init().catch(console.error)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [context.address])

  const locationSync = (state) => {
    const address = context.proxyAddress || context.address
    switch (state) {
      case '/tz':
      case '/feed/friends':
        return `${state}/${address}`
      case '/settings':
      case '/subjkt':
      case '/mint':
      case '/collaborate':
        return state
      default:
        return '/'
    }
  }
  if (context.address) {
    return <Navigate to={locationSync(location.state)} replace />
  }

  return (
    <Page title="">
      <Container>
        <Loading message="Requesting Permissions" />
        <Button to="/sync">try again?</Button>
      </Container>
    </Page>
  )
}
