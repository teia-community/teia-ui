import Button from '@atoms/button/Button'
import { walletPreview } from '@utils/string'

/**
 * Link to a user profile from an event participant.
 */
export function UserLink({ address, name }) {
  if (!address) return <span>—</span>
  if (name) {
    return <Button to={`/${encodeURIComponent(name)}`}>{name}</Button>
  }
  return <Button to={`/tz/${address}`}>{walletPreview(address)}</Button>
}

export default UserLink
