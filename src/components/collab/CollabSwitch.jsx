import { Button } from '@atoms/button'
import { fetchGraphQL, getCollabsForAddress } from '@data/api'
import { CollabContractsOverview } from '@pages/collaborate/manage'
import { useEffect, useState } from 'react'

import collabStyles from '@components/collab/index.module.scss'
import classNames from 'classnames'

export const CollabSwitch = ({ address, name, className }) => {
  const [collabs, setCollabs] = useState([])
  const [selectCollab, setSelectCollab] = useState(false)

  useEffect(() => {
    // On boot, see what addresses the synced address can manage
    fetchGraphQL(getCollabsForAddress, 'GetCollabs', {
      address: address,
    }).then(({ data, errors }) => {
      if (data) {
        // const shareholderInfo = data.shareholder.map(s => s.split_contract);
        // setCollabs(shareholderInfo || [])
        const managedCollabs = data.split_contracts
        setCollabs(managedCollabs || [])
      }
    })
  }, [address])

  const flexBetween = classNames(
    collabStyles.flex,
    collabStyles.flexBetween,
    className
  )

  return (
    <>
      {/* User has collabs available */}
      {collabs.length > 0 && (
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
