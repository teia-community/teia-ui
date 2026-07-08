import { Navigate } from 'react-router-dom'
import { Loading } from '@atoms/loading'
import { PATH } from '@constants'
import { useCanModerate } from './useCanModerate'

/**
 * Route guard for the moderation panels. Might be removed.
 */
export default function RequireModerator({ children }) {
  const { canModerate, resolved } = useCanModerate()
  if (!resolved) return <Loading message="Checking permissions…" />
  if (!canModerate) return <Navigate to={PATH.FEED} replace />
  return children
}
