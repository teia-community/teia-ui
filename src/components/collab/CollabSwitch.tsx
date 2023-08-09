import { Button } from '@atoms/button'
import { apiSWR } from '@data/api'
import { CollabContractsOverview } from '@pages/collaborate/manage'
import { useState } from 'react'

import collabStyles from '@components/collab/index.module.scss'
import classNames from 'classnames'
// import { Teia_Split_Contracts } from 'gql'
import { Loading } from '@atoms/loading'

export const CollabSwitch = ({
  address,
  name,
  className,
}: {
  address: string
  name: string
  className?: string
}) => {
  // const [collabs, setCollabs] = useState<Teia_Split_Contracts[]>()
  const [selectCollab, setSelectCollab] = useState(false)

  const { data, error } = apiSWR.useGetCollabsForAddress('collab-switch', {
    address,
  })

  if (error) {
    throw error
  }

  const flexBetween = classNames(
    collabStyles.flex,
    collabStyles.flexBetween,
    className
  )
  if (!address) {
    return <p>Not logged in</p>
  }
  if (!data) {
    return <Loading message={'loading collab switch'} />
  }

  return (
    <>
      {/* User has collabs available */}
      {data.split_contracts.length > 0 && (
        <div className={flexBetween}>
          <p>
            <span style={{ opacity: 0.5 }}>minting as</span> {name}
          </p>
          <Button shadow_box onClick={() => setSelectCollab(!selectCollab)}>
            {selectCollab ? 'Cancel' : 'Change'}
          </Button>
        </div>
      )}

      {selectCollab && <CollabContractsOverview showAdminOnly />}
    </>
  )
}
