import { useState } from 'react'
import classNames from 'classnames'
import { Secondary } from '@atoms/button'
import styles from '../index.module.scss'
import { ossProjects } from '@constants'

export const ProjectList = ({ beneficiaries, onSelect }: { beneficiaries: any[]; onSelect: (address: string, name: string) => void }) => {
  const [showList, setShowList] = useState(false)

  const beneficiaryAddresses = beneficiaries.map((b: any) => b.address)
  const validBeneficiaries = beneficiaries.filter((b: any) => b.address && b.shares)
  const unselectedProjects = ossProjects.filter(
    (project) => !beneficiaryAddresses.includes(project.address)
  )
  const btnClass = classNames(styles.btn, {
    [styles.muted]:
      showList ||
      unselectedProjects.length < ossProjects.length ||
      validBeneficiaries.length > 0,
    [styles.absolute]: showList,
  })

  const _select = (address: string, name: string) => {
    onSelect(address, name)
    setShowList(false)
  }

  return unselectedProjects.length > 0 ? (
    <div className={showList ? styles.projectList : undefined}>
      <button className={btnClass} onClick={() => setShowList(!showList)}>
        <Secondary>
          {showList ? 'Close' : 'Choose from popular projects'}
        </Secondary>
      </button>

      {showList && (
        <ul className={styles.list}>
          {unselectedProjects.map((project: any) => {
            const { name, address } = project

            return (
              <li key={address}>
                <button
                  className={styles.btn}
                  onClick={() => _select(address, name)}
                >
                  {name}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  ) : null
}
