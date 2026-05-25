import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router'
import { useUserStore } from '@context/userStore'
import { useMyInbox } from '@data/messaging/channels'

export default function DmRedirect() {
  const { address: peer } = useParams()
  const viewer = useUserStore((st) => st.address)
  const { data: inbox, isLoading } = useMyInbox(viewer)
  const navigate = useNavigate()

  useEffect(() => {
    if (!viewer) {
      navigate('/messages', { replace: true })
      return
    }
    if (!peer || isLoading || !inbox) return

    const existing = inbox.find(
      (c) =>
        c.metadata.kind === 'dm' &&
        (c.metadata.participants ?? []).includes(peer)
    )

    if (existing) {
      navigate(`/messages/channels/${existing.id}`, { replace: true })
    } else {
      navigate(`/messages/channels/create?dm=${peer}`, { replace: true })
    }
  }, [viewer, peer, inbox, isLoading, navigate])

  return null
}
