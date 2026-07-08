import { useModalStore } from '@context/modalStore'
import { QUIPUSWAP_TEIA_URL } from '@constants'

/** Shown when a user without TEIA tokens tries to propose a calendar event. */
export function showGetTeiaModal() {
  useModalStore
    .getState()
    .show(
      'TEIA required to contribute',
      `Anyone can view the calendar, but proposing an event requires holding TEIA tokens so the community can govern contributions.\n\n[Convert XTZ to TEIA on Quipuswap (Decentralized Exchange)](${QUIPUSWAP_TEIA_URL})`
    )
}
