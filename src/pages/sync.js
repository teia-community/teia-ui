import React, { useContext, useEffect } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { TeiaContext } from '@context/TeiaContext'
import { Page, Container } from '@atoms/layout'
import { LoadingContainer } from '@atoms/loading'
import { Button, Primary } from '@atoms/button'

export default function Sync() {
  const location = useLocation()
  const context = useContext(TeiaContext)

  useEffect(() => {
    const init = async () => {
      if (!context.acc) {
        await context.syncTaquito()
      }
      await context.setAccount()
    }
    init().catch(console.error)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [context.acc])

  const locationSync = (state) => {
    const address = context.getProxy() || context.acc.address
    switch (state) {
      case '/tz':
      case '/friends':
        return `${state}/${address}`
      case '/config':
      case '/mint':
        return state
      default:
        return '/'
    }
  }
  if (context.acc) {
    return <Navigate to={locationSync(location.state)} replace />
  }

  return (
    <Page title="">
      <Container>
        <p>requesting permissions</p>
        <Button to="/sync">
          <Primary>try again?</Primary>
        </Button>
        <LoadingContainer />
      </Container>
    </Page>
  )
}
