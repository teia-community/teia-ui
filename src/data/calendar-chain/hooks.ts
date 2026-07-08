// SWR hooks for the on-chain calendar: account roles + the moderator proposal
// queue.

import useSWR from 'swr'
import { useUserStore } from '@context/userStore'
import { useGateRoles } from '@data/roles'
import { fetchProposals } from './api'
import { fetchEventContent } from './ipfs'
import type { CalendarProposal, CalendarEventContent } from './types'

export interface CalendarRoles {
  /** Moderator or multisig member — can create/edit/hide + approve/reject. */
  canModerate: boolean
  /** Holds TEIA — can propose new events and edits. */
  canPropose: boolean
  isConnected: boolean
  /** Roles are still resolving for a connected wallet. */
  loading: boolean
}

/** Current account's calendar capabilities. */
export function useCalendarRoles(): CalendarRoles {
  const address = useUserStore((st) => st.address)
  const { data } = useGateRoles(address)
  return {
    canModerate: Boolean(data?.canModerate),
    canPropose: Boolean(data?.isTokenHolder),
    isConnected: Boolean(address),
    loading: Boolean(address) && !data,
  }
}

export interface ProposalListItem extends CalendarProposal {
  /** Proposed title, resolved from the proposal's IPFS document. */
  title: string
  /** The full proposed document; undefined when the IPFS fetch failed. */
  doc?: CalendarEventContent
}

/**
 * Pending proposals with their proposed document resolved from IPFS, for the
 * moderator queue — moderators must see what they approve, not just a title.
 * Only fetches when `enabled` (i.e. the viewer can moderate).
 */
export function useCalendarProposals(enabled: boolean) {
  return useSWR<ProposalListItem[]>(
    enabled ? 'calendar/proposals' : null,
    async () => {
      const proposals = (await fetchProposals()).filter(
        (p) => p.status === 'pending'
      )
      const docs = await Promise.allSettled(
        proposals.map((p) => fetchEventContent(p.proposedCid))
      )
      return proposals.map((p, i) => {
        const r = docs[i]
        const doc = r.status === 'fulfilled' ? r.value : undefined
        return {
          ...p,
          title: doc?.title || 'Untitled',
          doc,
        }
      })
    },
    { revalidateOnFocus: false, dedupingInterval: 15_000 }
  )
}
