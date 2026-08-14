import { useOutletContext } from 'react-router'
import { Loading } from '@atoms/loading'
import { useCurationsByOwner } from '@data/curations'
import { useUserStore } from '@context/userStore'
import CurationGrid from '@pages/curations/CurationGrid'

/** Profile "Curations" tab */
export default function ProfileCurations() {
  const { address } = useOutletContext()
  const viewer = useUserStore((st) => st.address)
  const { curations, error, isLoading } = useCurationsByOwner(address)

  if (isLoading) {
    return <Loading message="Loading curations" />
  }

  if (error) {
    return <p style={{ paddingTop: '2rem' }}>Could not load curations.</p>
  }

  const isOwner = viewer && viewer === address
  const visible = isOwner ? curations : curations.filter((c) => !c.hidden)

  return (
    <div style={{ paddingTop: '2rem' }}>
      <CurationGrid curations={visible} emptyMessage="No curations yet." />
    </div>
  )
}
