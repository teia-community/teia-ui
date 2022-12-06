import React, { useState, useMemo } from 'react'
import get from 'lodash/get'
import { Container, Padding } from '@components/layout'
import { Loading } from '@components/loading'
import { Button, Primary } from '@components/button'
import { Page } from '@components/layout'
import { CollabsTab } from '@components/collab/show/CollabsTab'
import { useParams, NavLink, Route, Routes } from 'react-router-dom'
import useSWR from 'swr'
import { getUser } from '@data/api'
import { GetUserMetadata } from '@data/api'
import useSettings from '@hooks/use-settings'
import { validateAddress, ValidationResult } from '@taquito/utils'
import Profile from './profile'
import Creations from './creations'
import Collections from './collections'
import styles from './styles.module.scss'

function Tab({ children, to }) {
  return (
    <NavLink
      style={({ isActive }) =>
        isActive
          ? {
              textDecoration: 'underline',
            }
          : undefined
      }
      className="tag"
      to={to}
      end
    >
      {children}
    </NavLink>
  )
}

async function fetchUserInfo(addressOrSubjkt, type = 'user_address') {
  let holder = await getUser(addressOrSubjkt, type)

  if (!holder && type !== 'user_address') {
    throw new Error('user not found')
  } else if (
    !holder &&
    validateAddress(addressOrSubjkt) === ValidationResult.VALID
  ) {
    holder = {
      user_address: addressOrSubjkt,
    }
  }

  const userMetadata = (await GetUserMetadata(holder.user_address)).data
  const user = userMetadata ? { ...userMetadata } : {}

  user.address = holder.user_address

  if (get(holder, 'metadata.data.description')) {
    user.description = get(holder, 'metadata.data.description')
  }

  if (get(holder, 'metadata.data.identicon')) {
    user.identicon = get(holder, 'metadata.data.identicon')
  }

  if (holder.name) {
    user.subjkt = holder.name
  }

  return user
}

export default function Display() {
  const { address, subjkt } = useParams()
  const { walletBlockMap } = useSettings()
  const isRestrictedUser = useMemo(
    () => walletBlockMap.get(address) === 1,
    [address, walletBlockMap]
  )
  const [showFilters, setShowFilters] = useState(false)

  const { data: user, error } = useSWR(
    ['/user', address || subjkt],
    (_, addressOrSubject) =>
      fetchUserInfo(addressOrSubject, address ? 'user_address' : 'name'),
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
    }
  )

  if (error) {
    // TODO: find a nice way to display errors.
    return <pre>{error.message}</pre>
  }

  if (!user) {
    return (
      <Container>
        <Padding>
          <Loading />
        </Padding>
      </Container>
    )
  }

  return (
    <Page title={user.alias}>
      <Profile user={user} />

      {user.address.substr(0, 2) !== 'KT' && (
        <Container>
          <Padding>
            <div className={styles.menu}>
              <Tab to={``}>Creations</Tab>
              <Tab to={`collection`}>Collection</Tab>
              <Tab to={`collabs`}>Collabs</Tab>

              <div className={styles.filter}>
                <Button
                  onClick={() => {
                    setShowFilters(!showFilters)
                  }}
                >
                  <Primary>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="feather feather-filter"
                    >
                      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
                    </svg>
                  </Primary>
                </Button>
              </div>
            </div>
          </Padding>
        </Container>
      )}

      {isRestrictedUser && (
        <Container>
          <Padding>
            <div
              style={{
                color: 'white',
                background: 'black',
                textAlign: 'center',
              }}
            >
              Restricted account
            </div>
          </Padding>
        </Container>
      )}

      <Routes>
        <Route
          index
          element={
            <Creations showFilters={showFilters} address={user.address} />
          }
        />
        <Route
          path="/collection"
          element={
            <Collections showFilters={showFilters} address={user.address} />
          }
        />
        <Route
          path="/collabs"
          element={<CollabsTab wallet={user.address} onLoaded={() => {}} />}
        />
      </Routes>
    </Page>
  )
}
