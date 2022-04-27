import React, { useContext, useEffect } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { HicetnuncContext } from '@context/HicetnuncContext'
import { Page, Container, Padding } from '@components/layout'
import { LoadingContainer } from '@components/loading'
import { Button, Primary } from '@components/button'

export default function Sync() {
  const location = useLocation()
  const context = useContext(HicetnuncContext)

  useEffect(() => {
    ;(async () => {
      if (!context.acc) {
        await context.syncTaquito()
        await context.setAccount()
      } else {
        await context.setAccount()
      }
    })()
  }, [context])

  return context.acc ? (
    <Navigate
      to={`/${location.state}/${context.getProxy() || context.acc.address}`}
      replace
    />
  ) : (
    <Page title="">
      <Container>
        <Padding>
          <p>requesting permissions</p>
          <Button to="/sync">
            <Primary>try again?</Primary>
          </Button>
          <LoadingContainer />
        </Padding>
      </Container>
    </Page>
  )
}
