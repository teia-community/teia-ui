// Poll descriptions come off the contract as bytes and arrive in two shapes.
//
// Polls created before descriptions were stored on chain hold an `ipfs://`
// pointer to a text file; newer ones hold the text itself. Both have to render,
// so the shape is decided in one place.

/**
 * @param {string} description decoded contract bytes
 * @returns {{ kind: 'none' | 'text' | 'ipfs', text?: string, cid?: string }}
 */
export function parsePollDescription(description) {
  const value = String(description || '').trim()
  if (value === '') return { kind: 'none' }

  const match = value.match(/^ipfs:\/\/([A-Za-z0-9]+)/)
  if (match) return { kind: 'ipfs', cid: match[1] }

  return { kind: 'text', text: value }
}
