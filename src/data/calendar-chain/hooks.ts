// SWR hooks for the on-chain calendar: account roles + the moderator proposal
// queue.

import useSWR from 'swr'
import { useUserStore } from '@context/userStore'
import { useGateRoles } from '@data/roles'
import { fetchProposals } from './api'
import { fetchChainCalendarEvents } from './index'
import { fetchEventContent } from './ipfs'
import type {
  CalendarProposal,
  CalendarEventContent,
  CalendarFeedEvent,
} from './types'

export interface CalendarRoles {
  /** Connected wallet address, for own-event ("proposed by me") checks. */
  address?: string
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
    address,
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
 * All community proposals (any status), each with its proposed document
 * resolved from IPFS — moderators must see what they approve, not just a title.
 * Callers filter by status (pending / approved / rejected). Only fetches when
 * `enabled` (i.e. the viewer can moderate).
 */
export function useCalendarProposals(enabled: boolean) {
  return useSWR<ProposalListItem[]>(
    enabled ? 'calendar/proposals' : null,
    async () => {
      const proposals = await fetchProposals()
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

/**
 * All on-chain events for the moderation console, collapsed to one row per
 * series (recurring occurrences share an eventId). Includes hidden events so a
 * moderator can unhide them. Only fetches when `enabled` (viewer can moderate).
 */
export function useModeratableEvents(enabled: boolean) {
  const address = useUserStore((st) => st.address)
  return useSWR<CalendarFeedEvent[]>(
    enabled ? ['calendar/mod-events', address] : null,
    async () => {
      const events = await fetchChainCalendarEvents({
        includeHidden: true,
        viewerAddress: address,
      })
      // Collapse recurring occurrences to one entry per series (by eventId).
      const seen = new Set<number>()
      const series: CalendarFeedEvent[] = []
      for (const ev of events) {
        if (seen.has(ev.eventId)) continue
        seen.add(ev.eventId)
        series.push(ev)
      }
      return series.sort((a, b) => a.eventId - b.eventId)
    },
    { revalidateOnFocus: false, dedupingInterval: 15_000 }
  )
}
