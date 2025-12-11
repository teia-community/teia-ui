import styles from '../index.module.scss'
import { ossProjects } from '@constants'
import { TipSelector } from './TipSelector'

export const TipJar = ({ tips, setTips }: { tips: any[]; setTips: (tips: any[]) => void }) => {
  const tipsByAddress = tips.map((t: any) => t.address)

  const toggleTip = (address: string) => {
    const updatedTips = [...tips]

    const index = tipsByAddress.indexOf(address)

    if (index > -1) {
      updatedTips.splice(index, 1)
    } else {
      const projectsByAddress = ossProjects.map((project: any) => project.address)
      const index = projectsByAddress.indexOf(address)
      const project = ossProjects[index]

      updatedTips.push(project)
    }

    setTips(updatedTips)
  }

  const _updateTip = (address: string, percentage: number) => {
    const updatedTips = [...tips]
    const projectsByAddress = updatedTips.map((t: any) => t.address)
    const index = projectsByAddress.indexOf(address)

    // toggle if it's the same value
    const shouldRemove = updatedTips[index]
      ? updatedTips[index].percentage === percentage
      : false

    updatedTips[index] = {
      ...tips[index],
      percentage: shouldRemove ? undefined : percentage,
    }

    setTips(updatedTips)
  }

  return (
    <ul className={styles.list}>
      {ossProjects.map((project: any, projectIndex: number) => {
        const { name, address } = project
        const isChecked = tipsByAddress.includes(address)

        return (
          <li key={project.address}>
            <div className={styles.flexBetween}>
              <label className={styles.flex}>
                <div>
                  <input
                    className={styles.check}
                    type="checkbox"
                    onChange={() => toggleTip(address)}
                  />
                  {name}
                </div>
              </label>

              {isChecked && (
                <TipSelector
                  onSelect={(percentage: number) =>
                    _updateTip(project.address, percentage)
                  }
                />
              )}
            </div>
          </li>
        )
      })}
    </ul>
  )
}
