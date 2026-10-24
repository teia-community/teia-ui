// Every fee Teia charges, read from the contracts that charge them.
//
// The fees were previously written into the front end as constants, which
// meant a fee the core team changed on-chain would keep showing its old value
// here. Each one is now read from its contract, so this page cannot drift from
// what is actually charged.
//
// Each content contract carries its own small governance: multisig members
// vote inside that contract to change its fees. The marketplace is the
// exception -- the multisig is its manager, so its fee changes by a multisig
// proposal instead.

import useSWR from 'swr'
import {
  CHANNELS_V2_CONTRACT,
  POLL_COMMENTS_CONTRACT,
  TOKEN_COMMENTS_CONTRACT,
  WIKI_CONTRACT,
  CURATIONS_CONTRACT,
  CALENDAR_CONTRACT,
  COPYRIGHT_CONTRACT,
  MARKETPLACE_CONTRACT_TEIA,
} from '@constants'

const TZKT_API = import.meta.env.VITE_TZKT_API

export type FeeUnit = 'mutez' | 'permille'

export interface Fee {
  label: string
  /** Raw on-chain value; `unit` says how to read it. */
  value: number | null
  unit: FeeUnit
}

export interface FeeGroup {
  key: string
  name: string
  address: string
  /** How this contract's fees get changed. */
  governedBy: 'contract-vote' | 'multisig-proposal'
  fees: Fee[]
  recipient: string | null
}

/** Storage field -> what to call it, in the order a reader wants them. */
const GROUPS: {
  key: string
  name: string
  address: string
  governedBy: FeeGroup['governedBy']
  fields: [string, string, FeeUnit?][]
}[] = [
  {
    key: 'marketplace',
    name: 'Marketplace',
    address: MARKETPLACE_CONTRACT_TEIA,
    governedBy: 'multisig-proposal',
    fields: [['fee', 'Commission on each sale', 'permille']],
  },
  {
    key: 'channels',
    name: 'Channels & DMs',
    address: CHANNELS_V2_CONTRACT,
    governedBy: 'contract-vote',
    fields: [
      ['channel_fee', 'Create a channel or DM'],
      ['post_fee', 'Post a message'],
      ['edit_fee', 'Edit a message'],
      ['hide_fee', 'Hide a message'],
    ],
  },
  {
    key: 'poll-comments',
    name: 'Poll comments',
    address: POLL_COMMENTS_CONTRACT,
    governedBy: 'contract-vote',
    fields: [
      ['post_fee', 'Post a comment'],
      ['edit_fee', 'Edit a comment'],
      ['hide_fee', 'Hide a comment'],
    ],
  },
  {
    key: 'token-comments',
    name: 'Artwork comments',
    address: TOKEN_COMMENTS_CONTRACT,
    governedBy: 'contract-vote',
    fields: [
      ['post_fee', 'Post a comment'],
      ['edit_fee', 'Edit a comment'],
      ['hide_fee', 'Hide a comment'],
    ],
  },
  {
    key: 'curations',
    name: 'Curations',
    address: CURATIONS_CONTRACT,
    governedBy: 'contract-vote',
    fields: [
      ['create_fee', 'Create a curation'],
      ['edit_fee', 'Edit a curation'],
    ],
  },
  {
    key: 'calendar',
    name: 'Calendar',
    address: CALENDAR_CONTRACT,
    governedBy: 'contract-vote',
    fields: [
      ['propose_event_fee', 'Propose an event'],
      ['propose_edit_fee', 'Propose an edit'],
    ],
  },
  {
    key: 'wiki',
    name: 'Wiki',
    address: WIKI_CONTRACT,
    governedBy: 'contract-vote',
    fields: [
      ['propose_page_fee', 'Propose a page'],
      ['propose_edit_fee', 'Propose an edit'],
    ],
  },
  {
    key: 'copyright',
    name: 'Copyright register',
    address: COPYRIGHT_CONTRACT,
    governedBy: 'contract-vote',
    fields: [['treasury_fee', 'Register a work']],
  },
]

async function fetchStorage(address: string): Promise<Record<string, any>> {
  const res = await fetch(`${TZKT_API}/v1/contracts/${address}/storage`)
  if (!res.ok) throw new Error(`TzKT error: ${res.status}`)
  return res.json()
}

/** Every fee on Teia, as the contracts currently hold them. */
export function useTeiaFees() {
  const { data, error } = useSWR(
    'teia:fees',
    async () => {
      const storages = await Promise.all(
        GROUPS.map((group) =>
          fetchStorage(group.address).catch(() => null)
        )
      )

      return GROUPS.map((group, index): FeeGroup => {
        const storage = storages[index]
        return {
          key: group.key,
          name: group.name,
          address: group.address,
          governedBy: group.governedBy,
          recipient: storage?.fee_recipient ?? null,
          fees: group.fields.map(([field, label, unit]) => ({
            label,
            // A contract that could not be read shows nothing rather than
            // a zero, which would read as "free".
            value: storage?.[field] == null ? null : Number(storage[field]),
            unit: unit ?? 'mutez',
          })),
        }
      })
    },
    { revalidateOnFocus: false, dedupingInterval: 60_000 }
  )

  return { groups: data ?? [], error, isLoading: !data && !error }
}

export default useTeiaFees
