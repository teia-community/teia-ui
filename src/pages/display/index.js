import React from 'react'
import { Page } from '@components/layout'
import { useParams } from 'react-router-dom'
import useSWR from 'swr'
import { fetchGraphQL } from '@data/hicdex'
import { GetUserMetadata } from '@data/api'
import { IconCache } from '@utils/with-icon'
import Profile from './profile'
const axios = require('axios')

async function getHolder(address) {
  const { data } = await fetchGraphQL(
    `
  query addressQuery($address: String!) {
    holder(where: { address: {_eq: $address}}) {
      address
      name
      hdao_balance
      metadata
      metadata_file
    }
  }
  `,
    'addressQuery',
    {
      address,
    }
  )

  return data && data.holder && data.holder.length ? data.holder[0] : null
}

async function fetchUserInfo(key, address) {
  const userMetadata = (await GetUserMetadata(address)).data
  const user = userMetadata ? { ...userMetadata } : {}
  const holder = await getHolder(address)

  if (holder) {
    let meta = (
      await axios.get(
        'https://cloudflare-ipfs.com/ipfs/' +
          holder.metadata_file.split('//')[1]
      )
    ).data

    if (meta.description) {
      user.description = meta.description
    }

    if (meta.identicon) {
      user.identicon = meta.identicon
    }

    if (holder.name) {
      user.subjkt = holder.name
    }
  }

  return user
}

export default function Display() {
  // TODO: handle subjkt case
  const { address } = useParams()

  const { data: user } = useSWR(['/user', address], fetchUserInfo, {
    revalidateIfStale: false,
    revalidateOnFocus: false,
  })

  if (!user) {
    return 'loading'
  }

  return (
    <Page title={user.alias}>
      <IconCache.Provider value={{}}>
        <Profile user={user} />
      </IconCache.Provider>
    </Page>
  )
}
