import { useState, useMemo, useLayoutEffect } from 'react'
import get from 'lodash/get'
import { Loading } from '@atoms/loading'
import { Page } from '@atoms/layout'
import { useParams, useSearchParams, Outlet } from 'react-router-dom'
import useSWR from 'swr'
import { getUser } from '@data/api'
import { GetUserMetadata } from '@data/api'
import useSettings from '@hooks/use-settings'
import { validateAddress, ValidationResult } from '@taquito/utils'
import Profile from './profile'
import styles from '@style'
import { Tabs } from '@atoms/tab'
import Button from '@atoms/button/Button'
import useLocalSettings from '@hooks/use-local-settings'
import { Warning } from './warning'

async function fetchUserInfo(addressOrSubjkt, type = 'user_address') {
  let holder = await getUser(addressOrSubjkt, type)
  if (!holder && type !== 'user_address') {
    throw new Error(`SUBJKT ${addressOrSubjkt} is not registered`, {
      cause: 'User not found',
    })
  } else if (
    !holder &&
    validateAddress(addressOrSubjkt) === ValidationResult.VALID
  ) {
    holder = {
      user_address: addressOrSubjkt,
    }
  }

  if (!holder?.user_address) {
    throw new Error(`Invalid or missing Tz address: ${addressOrSubjkt}`, {
      cause: 'Address not found',
    })
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
  const { address, id: subjkt } = useParams()
  const { walletBlockMap, underReviewMap } = useSettings()
  const [overridePopup, setOverridePopup] = useState()

  const [showRestricted, setShowRestricted] = useState()
  const [overrideProtections, setOverrideProtections] = useState()

  let [searchParams] = useSearchParams()

  const { nsfwFriendly, photosensitiveFriendly } = useLocalSettings()

  useLayoutEffect(() => {
    if (searchParams.get('yolo') !== null) {
      if (!nsfwFriendly || !photosensitiveFriendly) setOverridePopup(true)
    }
    setShowRestricted(searchParams.get('show') !== null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // TODO (mel): properly remove all this once migrated to the filter panel.
  const [showFilters /*setShowFilters*/] = useState(false)
  const { data: user, error } = useSWR(
    ['/user', address || subjkt],
    (_, addressOrSubject) =>
      fetchUserInfo(addressOrSubject, address ? 'user_address' : 'name'),
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
    }
  )

  const isRestrictedUser = useMemo(() => {
    if (!user?.address) return false
    return walletBlockMap.get(user.address) === 1
  }, [user?.address, walletBlockMap])

  const isUnderReviewUser = useMemo(() => {
    if (!user?.address) return false
    return underReviewMap.get(user.address) === 1
  }, [user?.address, underReviewMap])

  if (error) {
    throw error
  }

  if (!user) {
    return (
      <Page title="loading">
        <Loading message="Getting user profile" />
      </Page>
    )
  }

  const TABS = [
    { title: 'Creations', to: '' },
    { title: 'Collection', to: 'collection' },
    { title: 'Collabs', to: 'collabs' },
  ]

  return (
    <Page feed title={user.alias}>
      {overridePopup ? (
        <Warning
          onInteract={(e) => {
            setOverrideProtections(e)
            setOverridePopup(false)
          }}
        />
      ) : (
        <>
          <Profile user={user} />
          {user.address.substr(0, 2) !== 'KT' && (
            <div className={styles.menu}>
              <Tabs tabs={TABS} />

              {/* <div className={styles.filter}>
          <Button
            onClick={() => {
              setShowFilters(!showFilters)
            }}
          >
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
          </Button>
        </div> */}
            </div>
          )}
          {(isRestrictedUser || isUnderReviewUser) && (
            <div className={styles.restricted}>
              <h1>
                {isUnderReviewUser ? 'Under review' : 'Restricted'} account
                {showRestricted ? '(bypassed)' : ''}
              </h1>
              <p>
                Contact the Teia moderators on
                <Button small inline href="https://discord.gg/TKeybhYhNe">
                  Discord
                </Button>
                to resolve the status.
              </p>
              <p>
                See the
                <Button
                  inline
                  small
                  href="https://github.com/teia-community/teia-docs/wiki/Core-Values-Code-of-Conduct-Terms-and-Conditions#3-terms-and-conditions---account-restrictions"
                >
                  Teia Terms and Conditions
                </Button>
              </p>
            </div>
          )}

          <Outlet
            context={{
              showRestricted,
              overrideProtections,
              showFilters,
              address: user.address,
            }}
          />
        </>
      )}
    </Page>
  )
}
