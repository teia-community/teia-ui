// SWR hooks for the on-chain events registry: the public list, account roles
// and the moderator views.

import useSWR from 'swr'
import { useRegistryRoles } from '@data/registries'
import {
  EVENTS_MOD_SWR_KEY,
  EVENTS_SWR_KEY,
  EVENT_PROPOSALS_SWR_KEY,
} from './actions'
import { fetchEventProposals } from './api'
import { fetchShowcaseEvents } from './index'
import { fetchEventContent } from './ipfs'
import type { EventContent, EventProposal, ShowcaseEvent } from './types'

const SWR_OPTIONS = { revalidateOnFocus: false, dedupingInterval: 15_000 }

/** The public events list (hidden events excluded), oldest first. */
export function useChainEvents() {
  const { data, error, mutate } = useSWR<ShowcaseEvent[]>(
    EVENTS_SWR_KEY,
    () => fetchShowcaseEvents(),
    SWR_OPTIONS
  )
  return {
    events: data ?? [],
    error,
    isLoading: !data && !error,
    refresh: mutate,
  }
}

/** Current account's capabilities on the events registry. */
export const useEventRoles = useRegistryRoles

export interface EventProposalListItem extends EventProposal {
  /** Proposed title, resolved from the proposal's IPFS document. */
  title: string
  /** The full proposed document; undefined when the IPFS fetch failed. */
  doc?: EventContent
}

/**
 * All community proposals (any status), each with its proposed document
 * resolved from IPFS — moderators must see what they approve. Only fetches
 * when `enabled` (i.e. the viewer can moderate).
 */
export function useEventProposals(enabled: boolean) {
  return useSWR<EventProposalListItem[]>(
    enabled ? EVENT_PROPOSALS_SWR_KEY : null,
    async () => {
      const proposals = await fetchEventProposals()
      const docs = await Promise.allSettled(
        proposals.map((p) => fetchEventContent(p.proposedCid))
      )
      return proposals.map((p, i) => {
        const r = docs[i]
        const doc = r.status === 'fulfilled' ? r.value : undefined
        return { ...p, title: doc?.title || 'Untitled', doc }
      })
    },
    SWR_OPTIONS
  )
}

/**
 * Every event including hidden ones, for the moderation console. Only fetches
 * when `enabled` (viewer can moderate).
 */
export function useModeratableEvents(enabled: boolean) {
  return useSWR<ShowcaseEvent[]>(
    enabled ? EVENTS_MOD_SWR_KEY : null,
    () => fetchShowcaseEvents({ includeHidden: true }),
    SWR_OPTIONS
  )
}
